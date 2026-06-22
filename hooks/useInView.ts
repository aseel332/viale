"use client";

import { useEffect, useRef, useState } from "react";

interface InViewOptions extends IntersectionObserverInit {
  once?: boolean;
}

export function useInView(options: InViewOptions = {}) {
  const { once = true, ...observerOptions } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px", ...observerOptions }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return { ref, inView };
}
