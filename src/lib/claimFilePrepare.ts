/** Soft target after compression — keeps email payloads reliable. */
export const CLAIM_FILE_TARGET_BYTES = 1_200_000;
/** Hard ceiling — reject if still larger after compression attempts. */
export const CLAIM_FILE_MAX_BYTES = 8_000_000;
const MAX_IMAGE_EDGE = 2000;

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

async function compressImageFile(file: File): Promise<ClaimFilePrepareResult> {
  const originalSize = file.size;
  if (originalSize <= CLAIM_FILE_TARGET_BYTES) {
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

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
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

    let quality = 0.82;
    let blob: Blob | null = null;
    while (quality >= 0.45) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
      );
      if (blob && blob.size <= CLAIM_FILE_TARGET_BYTES) break;
      quality -= 0.12;
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

    // If compression made it worse, keep original (unless over hard max).
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

/** Prepare one uploaded claim file: compress images when oversized, reject huge non-images. */
export async function prepareClaimFile(file: File): Promise<ClaimFilePrepareResult> {
  if (isImageFile(file)) return compressImageFile(file);
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
