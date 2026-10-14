import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AgencyPage from "@/components/AgencyPage";
import { agencyBtnOutline, agencyBtnPrimary, AgencySection, ArrowIcon } from "@/components/AgencyUi";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    console.log("Available routes:", ["/", "/purchase", "/buyinsnew", "/services", "/bbq", "/on-the-fire"]);
    console.log("Current pathname:", location.pathname);
    console.log("Is /bbq route registered?", location.pathname === "/bbq" || location.pathname === "/on-the-fire");
  }, [location.pathname]);

  return (
    <AgencyPage
      title={<span className="text-[clamp(96px,16vw,200px)] leading-[0.9]">404</span>}
      subtitle={
        <>
          הדף שחיפשתם לא נמצא <span lang="en">(Oops! Page not found)</span>
        </>
      }
    >
      <AgencySection>
        <div className="flex flex-wrap gap-3.5">
          <Link to="/" className={agencyBtnPrimary}>
            <span>חזרה לדף הבית</span>
            <ArrowIcon />
          </Link>
          <Link to="/purchase" className={agencyBtnOutline}>
            לרכישת ביטוח נסיעות
          </Link>
        </div>
      </AgencySection>
    </AgencyPage>
  );
};

export default NotFound;
