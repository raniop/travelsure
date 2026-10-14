import type { ReactNode } from "react";
import AgencyFooter from "@/components/AgencyFooter";
import AgencyHeader from "@/components/AgencyHeader";

interface AgencyPageProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Extra content under the title in the navy band (search box, chips, CTA). */
  bandContent?: ReactNode;
  /** Page background under the band. */
  surface?: "white" | "gray";
  children: ReactNode;
}

/**
 * Shell for inner pages in the agency design: navy band with the shared header
 * and page title, the page body, then the shared footer.
 */
const AgencyPage = ({ title, subtitle, bandContent, surface = "white", children }: AgencyPageProps) => (
  <div
    dir="rtl"
    className={`flex min-h-screen flex-col font-rubik text-[18px] leading-[1.45] text-[#000144] ${
      surface === "gray" ? "bg-[#F3F5F8]" : "bg-white"
    }`}
  >
    <section className="relative overflow-hidden bg-[#000144] text-white">
      <div aria-hidden="true" className="absolute left-[-120px] top-[-160px] h-[380px] w-[380px] rounded-full bg-[#0C1060]" />
      <div aria-hidden="true" className="absolute left-[260px] top-[70px] hidden h-[44px] w-[180px] rounded-full bg-white/[0.06] md:block" />
      <div className="relative mx-auto max-w-[1200px] px-6 pt-5">
        <AgencyHeader />
      </div>
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-3 px-6 pb-12 pt-12 md:pb-16 md:pt-14">
        <h1 className="m-0 text-[clamp(38px,5.6vw,80px)] font-black leading-[0.98] tracking-[-0.02em]">{title}</h1>
        {subtitle && (
          <p className="m-0 max-w-[760px] text-[clamp(18px,1.6vw,22px)] font-medium text-[#E3EAFF]">{subtitle}</p>
        )}
        {bandContent && <div className="mt-4">{bandContent}</div>}
      </div>
    </section>

    <main className="flex-1">{children}</main>

    <AgencyFooter />
  </div>
);

export default AgencyPage;
