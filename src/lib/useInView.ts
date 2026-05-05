import { useCallback, useEffect, useRef } from "react";

export function useInView(
  onEnter: () => void,
  rootMargin = "400px",
) {
  const callback = useRef(onEnter);
  callback.current = onEnter;

  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!node) return;
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) callback.current();
        },
        { rootMargin },
      );
      observer.current.observe(node);
    },
    [rootMargin],
  );

  useEffect(() => () => observer.current?.disconnect(), []);

  return ref;
}
