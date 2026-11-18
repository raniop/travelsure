import { useEffect } from "react";

/** Applies the BBQ look to the whole document (dialogs included) while a BBQ page is mounted. */
export function useBbqTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("bbq-theme");
    return () => root.classList.remove("bbq-theme");
  }, []);
}
