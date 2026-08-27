/** Soft target after compression — keeps email payloads reliable. */
export const CLAIM_FILE_TARGET_BYTES = 900_000;
/** Hard ceiling — reject if still larger after compression attempts. */
export const CLAIM_FILE_MAX_BYTES = 8_000_000;
/**
 * Max total raw file bytes sent in one claim invoke.
 * Base64 (~4/3) + JSON overhead must stay under Supabase ~6MB request limit.
 */
export const CLAIM_TOTAL_UPLOAD_BUDGET_BYTES = 3_200_000;
const MAX_IMAGE_EDGE = 1800;
const MAX_PDF_PAGES = 20;
const PDF_PAGE_EDGE = 1400;

export type ClaimFilePrepareResult = {
  file: File;
  compressed: boolean;
  originalSize: number;
  error?: string;
};

const isImageFile = (file: File) => {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name);
};

const isPdfFile = (file: File) =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name);

const renameKeepBase = (name: string, newExt: string) => {
  const base = name.replace(/\.[^.]+$/, "") || "file";
  return `${base}${newExt}`;
};

const loadImageElement = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_load_failed"));
    };
    img.src = url;
  });

async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
}

async function compressImageFile(
  file: File,
  targetBytes = CLAIM_FILE_TARGET_BYTES,
  maxEdge = MAX_IMAGE_EDGE
): Promise<ClaimFilePrepareResult> {
  const originalSize = file.size;
  if (originalSize <= targetBytes) {
    return { file, compressed: false, originalSize };
  }

  try {
    const img = await loadImageElement(file);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (!width || !height) {
      return originalSize > CLAIM_FILE_MAX_BYTES
        ? {
            file,
            compressed: false,
            originalSize,
            error: `"${file.name}" גדול מדי (${formatClaimFileSize(originalSize)}). נסו לצלם מחדש באיכות נמוכה יותר.`,
          }
        : { file, compressed: false, originalSize };
    }

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { file, compressed: false, originalSize };
    }
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.78;
    let blob: Blob | null = null;
    while (quality >= 0.4) {
      blob = await canvasToJpegBlob(canvas, quality);
      if (blob && blob.size <= targetBytes) break;
      quality -= 0.1;
    }

    if (!blob) {
      return originalSize > CLAIM_FILE_MAX_BYTES
        ? {
            file,
            compressed: false,
            originalSize,
            error: `"${file.name}" גדול מדי ולא ניתן לכווץ.`,
          }
        : { file, compressed: false, originalSize };
    }

    if (blob.size >= originalSize) {
      return originalSize > CLAIM_FILE_MAX_BYTES
        ? {
            file,
            compressed: false,
            originalSize,
            error: `"${file.name}" גדול מדי (${formatClaimFileSize(originalSize)}).`,
          }
        : { file, compressed: false, originalSize };
    }

    if (blob.size > CLAIM_FILE_MAX_BYTES) {
      return {
        file,
        compressed: false,
        originalSize,
        error: `"${file.name}" עדיין גדול מדי אחרי כיווץ (${formatClaimFileSize(blob.size)}).`,
      };
    }

    const compressedFile = new File([blob], renameKeepBase(file.name, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    return { file: compressedFile, compressed: true, originalSize };
  } catch {
    return originalSize > CLAIM_FILE_MAX_BYTES
      ? {
          file,
          compressed: false,
          originalSize,
          error: `"${file.name}" גדול מדי ולא ניתן לכווץ בדפדפן זה.`,
        }
      : { file, compressed: false, originalSize };
  }
}

type PdfjsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PdfjsDocument> };
};

type PdfjsDocument = {
  numPages: number;
  getPage: (n: number) => Promise<{
    getViewport: (opts: { scale: number }) => { width: number; height: number };
    render: (opts: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
      canvas?: HTMLCanvasElement;
    }) => { promise: Promise<void> };
  }>;
};

let pdfLibsPromise: Promise<{
  pdfjs: PdfjsModule;
  PDFDocument: {
    create: () => Promise<{
      embedJpg: (bytes: ArrayBuffer | Uint8Array) => Promise<{ width: number; height: number }>;
      addPage: (size: [number, number]) => { drawImage: (img: unknown, opts: Record<string, number>) => void };
      save: () => Promise<Uint8Array>;
    }>;
  };
}> | null = null;

async function loadPdfLibs() {
  if (!pdfLibsPromise) {
    pdfLibsPromise = (async () => {
      const [{ PDFDocument }, pdfjsMod, workerUrl] = await Promise.all([
        import("pdf-lib"),
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);
      const pdfjs = pdfjsMod as unknown as PdfjsModule;
      const workerSrc =
        typeof workerUrl === "string"
          ? workerUrl
          : String((workerUrl as { default?: string }).default || "");
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      return { pdfjs, PDFDocument: PDFDocument as never };
    })();
  }
  return pdfLibsPromise;
}

async function compressPdfFile(
  file: File,
  targetBytes = CLAIM_FILE_TARGET_BYTES,
  pageEdge = PDF_PAGE_EDGE,
  jpegQuality = 0.62
): Promise<ClaimFilePrepareResult> {
  const originalSize = file.size;
  if (originalSize <= targetBytes) {
    return { file, compressed: false, originalSize };
  }

  try {
    const { pdfjs, PDFDocument } = await loadPdfLibs();
    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: data.slice(0) }).promise;
    const pageCount = Math.min(pdf.numPages || 0, MAX_PDF_PAGES);
    if (!pageCount) {
      return prepareNonImageFile(file);
    }

    const out = await PDFDocument.create();
    for (let i = 1; i <= pageCount; i += 1) {
      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(1, pageEdge / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale: scale || 1 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const blob = await canvasToJpegBlob(canvas, jpegQuality);
      if (!blob) continue;
      const jpgBytes = new Uint8Array(await blob.arrayBuffer());
      const embedded = await out.embedJpg(jpgBytes);
      const outPage = out.addPage([embedded.width, embedded.height]);
      outPage.drawImage(embedded, {
        x: 0,
        y: 0,
        width: embedded.width,
        height: embedded.height,
      });
    }

    const saved = await out.save();
    if (!saved.byteLength || saved.byteLength >= originalSize) {
      if (originalSize > CLAIM_FILE_MAX_BYTES) {
        return {
          file,
          compressed: false,
          originalSize,
          error: `ה־PDF "${file.name}" גדול מדי (${formatClaimFileSize(originalSize)}) ולא ניתן לכווץ מספיק.`,
        };
      }
      return { file, compressed: false, originalSize };
    }

    if (saved.byteLength > CLAIM_FILE_MAX_BYTES) {
      // One more aggressive pass.
      if (pageEdge > 900 || jpegQuality > 0.45) {
        return compressPdfFile(file, targetBytes, Math.max(900, Math.floor(pageEdge * 0.75)), Math.max(0.42, jpegQuality - 0.12));
      }
      return {
        file,
        compressed: false,
        originalSize,
        error: `ה־PDF "${file.name}" עדיין גדול מדי אחרי כיווץ (${formatClaimFileSize(saved.byteLength)}). פצלו למספר קבצים או סרקו באיכות נמוכה יותר.`,
      };
    }

    // Still over soft target — try one tighter pass if helpful.
    if (saved.byteLength > targetBytes && (pageEdge > 1000 || jpegQuality > 0.5)) {
      const tighter = await compressPdfFile(
        file,
        targetBytes,
        Math.max(1000, Math.floor(pageEdge * 0.85)),
        Math.max(0.48, jpegQuality - 0.1)
      );
      if (tighter.compressed && tighter.file.size < saved.byteLength) return tighter;
    }

    const compressedFile = new File([saved], renameKeepBase(file.name, ".pdf"), {
      type: "application/pdf",
      lastModified: Date.now(),
    });
    return { file: compressedFile, compressed: true, originalSize };
  } catch (err) {
    console.error("PDF compress failed:", err);
    if (originalSize > CLAIM_FILE_MAX_BYTES) {
      return {
        file,
        compressed: false,
        originalSize,
        error: `ה־PDF "${file.name}" גדול מדי (${formatClaimFileSize(originalSize)}) ולא ניתן לכווץ בדפדפן זה.`,
      };
    }
    return { file, compressed: false, originalSize };
  }
}

function prepareNonImageFile(file: File): ClaimFilePrepareResult {
  const originalSize = file.size;
  if (originalSize <= CLAIM_FILE_MAX_BYTES) {
    return { file, compressed: false, originalSize };
  }
  const kind = isPdfFile(file) ? "PDF" : "קובץ";
  return {
    file,
    compressed: false,
    originalSize,
    error: `ה${kind} "${file.name}" גדול מדי (${formatClaimFileSize(originalSize)}). מומלץ עד ${formatClaimFileSize(CLAIM_FILE_MAX_BYTES)} — סרקו מחדש באיכות נמוכה יותר או פצלו למספר קבצים.`,
  };
}

/** Prepare one uploaded claim file: compress images/PDFs when oversized, reject huge others. */
export async function prepareClaimFile(
  file: File,
  targetBytes = CLAIM_FILE_TARGET_BYTES
): Promise<ClaimFilePrepareResult> {
  if (isImageFile(file)) return compressImageFile(file, targetBytes);
  if (isPdfFile(file)) return compressPdfFile(file, targetBytes);
  return prepareNonImageFile(file);
}

export async function prepareClaimFiles(files: File[]): Promise<{
  accepted: File[];
  compressedCount: number;
  errors: string[];
}> {
  const accepted: File[] = [];
  const errors: string[] = [];
  let compressedCount = 0;

  for (const file of files) {
    const result = await prepareClaimFile(file);
    if (result.error) {
      errors.push(result.error);
      continue;
    }
    if (result.compressed) compressedCount += 1;
    accepted.push(result.file);
  }

  return { accepted, compressedCount, errors };
}

export function formatClaimFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileDedupeKey(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

/** Drop exact duplicate attachments (same file chosen for two doc slots). */
export function dedupeClaimFiles(files: File[]): File[] {
  const seen = new Set<string>();
  const out: File[] = [];
  for (const file of files) {
    const key = fileDedupeKey(file);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(file);
  }
  return out;
}

export function totalClaimFilesBytes(files: File[]): number {
  return files.reduce((sum, f) => sum + (f.size || 0), 0);
}

/**
 * Ensure the attachment set fits the invoke budget: dedupe, then aggressively recompress.
 * Returns an error string if still too large.
 */
export async function fitClaimFilesForUpload(files: File[]): Promise<{
  files: File[];
  compressedCount: number;
  dedupedCount: number;
  error?: string;
}> {
  const unique = dedupeClaimFiles(files);
  const dedupedCount = files.length - unique.length;
  let working = [...unique];
  let compressedCount = 0;

  const ensurePrepared = async (list: File[], target: number) => {
    const next: File[] = [];
    for (const file of list) {
      const result = await prepareClaimFile(file, target);
      if (result.error) {
        return { files: next, error: result.error };
      }
      if (result.compressed) compressedCount += 1;
      next.push(result.file);
    }
    return { files: next };
  };

  let prepared = await ensurePrepared(working, CLAIM_FILE_TARGET_BYTES);
  if (prepared.error) return { files: working, compressedCount, dedupedCount, error: prepared.error };
  working = prepared.files;

  if (totalClaimFilesBytes(working) <= CLAIM_TOTAL_UPLOAD_BUDGET_BYTES) {
    return { files: working, compressedCount, dedupedCount };
  }

  // Aggressive second pass — smaller images/pages.
  prepared = await ensurePrepared(working, 450_000);
  if (prepared.error) return { files: working, compressedCount, dedupedCount, error: prepared.error };
  working = prepared.files;

  if (totalClaimFilesBytes(working) <= CLAIM_TOTAL_UPLOAD_BUDGET_BYTES) {
    return { files: working, compressedCount, dedupedCount };
  }

  return {
    files: working,
    compressedCount,
    dedupedCount,
    error:
      "המסמכים גדולים מדי לשליחה גם אחרי כיווץ אוטומטי. צרפו פחות קבצים, או סרקו/צלמו מחדש באיכות נמוכה יותר, ונסו שוב.",
  };
}

export function claimSubmitErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  const lower = raw.toLowerCase();
  if (
    lower.includes("too large") ||
    lower.includes("payload") ||
    lower.includes("413") ||
    lower.includes("entity too large") ||
    raw.includes("גדולים מדי")
  ) {
    return "המסמכים גדולים מדי לשליחה. נסו לצרף פחות קבצים או לצלם/לסרוק מחדש באיכות נמוכה יותר.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("offline") ||
    lower.includes("timeout") ||
    lower.includes("abort")
  ) {
    return "נראה שיש בעיית רשת. בדקו את החיבור לאינטרנט ונסו שוב. אם זה נמשך — שלחו את המסמכים ל־ophir@ophirins.co.il";
  }
  if (raw && raw !== "claim_submit_failed" && raw !== "fail" && !raw.startsWith("HTTP ")) {
    // Prefer our Hebrew messages when present.
    if (/[\u0590-\u05FF]/.test(raw)) return raw;
  }
  return "לא הצלחנו לשלוח את התביעה כרגע. נסו שוב בעוד כמה דקות. אם זה חוזר — כתבו ל־ophir@ophirins.co.il וצרפו את המסמכים.";
}
