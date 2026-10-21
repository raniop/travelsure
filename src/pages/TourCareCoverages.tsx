import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import AgencyPage from "@/components/AgencyPage";

// Rebuilt monthly by .github/workflows/update-tour-care-pdf.yml and served from main through
// jsDelivr, so a new month is live without a Lovable publish. The copy bundled with the site is
// the fallback when jsDelivr can't be reached. Fetched into a blob so it opens inside our page
// (a direct jsDelivr link downloads in some browsers instead of opening).
const LIVE_PDF = "https://cdn.jsdelivr.net/gh/raniop/travelsure@main/public/docs/tourists/tour-and-care-coverages.pdf";
const BUNDLED_PDF = "/docs/tourists/tour-and-care-coverages.pdf";
const FILE_NAME = "Tour-and-Care-כיסויים-ועלויות.pdf";

const fetchPdf = async (url: string) => {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(String(res.status));
  const blob = await res.blob();
  if (blob.size < 1000) throw new Error("empty");
  return new Blob([blob], { type: "application/pdf" });
};

const TourCareCoverages = () => {
  const [pdfUrl, setPdfUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;
    fetchPdf(LIVE_PDF)
      .catch(() => fetchPdf(BUNDLED_PDF))
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) URL.revokeObjectURL(objectUrl);
        else setPdfUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const downloadHref = pdfUrl || BUNDLED_PDF;

  return (
    <AgencyPage
      title="Tour & Care: כיסויים ועלויות"
      subtitle="ביטוח בריאות לתיירים ולתושבים חוזרים בישראל. המחירים מתעדכנים כל חודש לפי המדד."
      surface="gray"
      bandContent={
        <a
          href={downloadHref}
          download={FILE_NAME}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-[14px] bg-[#00A247] px-5 text-[17px] font-bold text-[#000144] no-underline"
        >
          <Download aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
          הורדת PDF
        </a>
      }
    >
      <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-6 md:py-12">
        {failed ? (
          <p className="m-0 rounded-[20px] border-2 border-[#E3E7EE] bg-white p-6 text-center">
            לא הצלחנו לטעון את המסמך.{" "}
            <a href={BUNDLED_PDF} className="font-bold text-[#000144]">
              לפתיחת הקובץ
            </a>
          </p>
        ) : !pdfUrl ? (
          <p className="m-0 flex items-center justify-center gap-2 py-16 text-[#46557A]">
            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
            טוענים את המסמך…
          </p>
        ) : (
          <>
            {/* Phones mostly can't show a PDF inside a page: offer it as a file instead */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[56px] items-center justify-center rounded-[18px] border-2 border-[#000144] bg-white text-[18px] font-bold text-[#000144] no-underline md:hidden"
            >
              פתיחת המסמך
            </a>
            <iframe
              src={pdfUrl}
              title="פירוט כיסויים ועלויות Tour & Care"
              className="hidden h-[85vh] w-full rounded-[20px] border-2 border-[#E3E7EE] bg-white md:block"
            />
          </>
        )}
      </div>
    </AgencyPage>
  );
};

export default TourCareCoverages;
