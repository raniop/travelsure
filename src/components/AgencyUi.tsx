import type { ReactNode } from "react";

/*
 * Agency design tokens (see /mockup-v2):
 *   navy #000144 · deep navy #0C1060 · green #00A247 (CTA bg, navy text)
 *   body text #33405F · labels #46557A · surface #F3F5F8 · field border #D5DAE3
 *   font Rubik (font-rubik) · cards 28px radius · buttons 18px · fields 14px
 * RTL gotcha: index.css forces `[dir=rtl] .flex.justify-between` to row-reverse,
 * so any flex + justify-between element needs an explicit !flex-row / !flex-col.
 */

export const agencyH2 = "m-0 text-[clamp(32px,4vw,56px)] font-black leading-[1.02] tracking-[-0.01em]";
export const agencyH3 = "m-0 text-[24px] font-black leading-[1.1] md:text-[28px]";
export const agencyBody = "m-0 text-[18px] font-medium text-[#33405F]";

export const agencyBtnPrimary =
  "inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-[18px] bg-[#00A247] px-7 text-[19px] font-extrabold text-[#000144] no-underline transition-colors hover:bg-[#008C3D]";
export const agencyBtnNavy =
  "inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-[18px] bg-[#000144] px-7 text-[19px] font-extrabold text-white no-underline transition-colors hover:bg-[#0C1060]";
export const agencyBtnOutline =
  "box-border inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-[18px] border-[3px] border-[#000144] px-7 text-[19px] font-extrabold text-[#000144] no-underline transition-colors hover:bg-[#000144] hover:text-white";

export const agencyCard = "box-border rounded-[28px] bg-[#F3F5F8] p-7";
export const agencyCardWhite = "box-border rounded-[28px] border-2 border-[#E3E7EE] bg-white p-7";

export const agencyLabel = "text-sm font-semibold text-[#46557A]";
export const agencyField =
  "box-border min-h-[52px] w-full rounded-[14px] border-2 border-[#D5DAE3] bg-white px-[14px] font-[inherit] text-[17px] font-semibold text-[#000144] focus:border-[#00A247] focus:outline-none";

/** Page section with the standard width and vertical rhythm. */
export const AgencySection = ({
  id,
  children,
  className = "",
  tone = "default",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "navy" | "gray";
}) => (
  <section
    id={id}
    className={`px-6 py-[72px] md:py-[88px] ${
      tone === "navy" ? "bg-[#000144] text-white" : tone === "gray" ? "bg-[#F3F5F8]" : ""
    } ${className}`}
  >
    <div className="mx-auto flex max-w-[1200px] flex-col gap-9">{children}</div>
  </section>
);

export const ArrowIcon = ({ size = 22 }: { size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="M11 6l-6 6 6 6" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

/** "Prefer a human?" strip with WhatsApp + phone, used at the bottom of pages. */
export const AgencyContactStrip = ({ title }: { title?: ReactNode }) => (
  <section aria-label="יצירת קשר" className="px-6 py-[72px]">
    <div className="mx-auto box-border flex max-w-[1200px] !flex-row flex-wrap items-center justify-between gap-x-12 gap-y-7 rounded-[36px] bg-[#F3F5F8] p-8 md:p-12">
      <h2 className={agencyH2}>
        {title ?? (
          <>
            מעדיפים לדבר
            <br />
            עם בן אדם?
          </>
        )}
      </h2>
      <div className="flex flex-wrap gap-3.5">
        <a href="https://wa.me/972523333603" className={agencyBtnNavy}>
          <WhatsAppIcon />
          <span>וואטסאפ</span>
        </a>
        <a href="tel:0732721111" className={agencyBtnOutline}>
          <span dir="ltr">073-2721111</span>
        </a>
      </div>
    </div>
  </section>
);
