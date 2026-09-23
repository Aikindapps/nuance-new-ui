import { useEffect, useState } from "react";

// Shared phone-viewport check (repo seam: <=1023px, Tailwind lg: is
// 1024). See src/index.css -- the --fpx anchor switches at this
// width too.
const QUERY = "(max-width: 1023px)";

export function useIsMobileViewport(): boolean {
  // Lazy initializer -- a phone's first paint already matches, so
  // there is no desktop-modal flash before the effect below can run.
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
