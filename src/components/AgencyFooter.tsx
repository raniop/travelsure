import { Link } from "react-router-dom";
import logo from "@/assets/ophir-logo.png";

const links = [
  ["/claim", "הגשת תביעה"],
  ["/forms", "טפסים"],
  ["/about", "אודות"],
  ["/contact", "צור קשר"],
  ["/privacy-policy", "מדיניות פרטיות"],
];

/** Navy footer from the agency design. */
const AgencyFooter = () => (
  <footer className="bg-[#000144] px-6 py-8 font-rubik text-[#C9D3EA]">
    {/* !flex-row: the global RTL `.flex.justify-between` rule would otherwise reverse it */}
    <div className="mx-auto flex max-w-[1200px] !flex-row flex-wrap items-center justify-between gap-x-8 gap-y-2.5 text-base">
      <span className="flex items-center gap-3">
        <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-white">
          <img src={logo} alt="" className="block h-[38px] w-auto" />
        </span>
        <span className="text-[20px] font-extrabold text-white">אופיר ושות׳ סוכנות לביטוח</span>
      </span>
      <span>מצדה 9, בני ברק</span>
      <a href="mailto:ophir@ophirins.co.il" className="inline-flex min-h-[44px] items-center text-[#C9D3EA] underline">
        ophir@ophirins.co.il
      </a>
      <nav aria-label="קישורים נוספים" className="flex flex-wrap gap-x-5">
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="inline-flex min-h-[44px] items-center text-[#C9D3EA] underline hover:text-white">
            {label}
          </Link>
        ))}
      </nav>
      <span>© 2026 כל הזכויות שמורות</span>
    </div>
  </footer>
);

export default AgencyFooter;
