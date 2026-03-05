import { useEffect } from "react";

const SCROLL_SELECTOR = "[role=log] > :first-child";

export const useGlobalScroll = (): void => {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const scrollEl = document.querySelector<HTMLElement>(SCROLL_SELECTOR);
      if (!scrollEl) return;

      if (scrollEl.contains(e.target as Node)) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
      const canScrollUp = scrollTop > 0;
      const scrollingDown = e.deltaY > 0;
      const scrollingUp = e.deltaY < 0;

      if ((scrollingDown && !canScrollDown) || (scrollingUp && !canScrollUp)) return;

      e.preventDefault();
      scrollEl.scrollBy({ left: e.deltaX, top: e.deltaY });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);
};
