"use client";

import { useEffect, useRef } from "react";

export function useFocusRefresh(cb: () => void) {
  const cbRef = useRef(cb);

  useEffect(() => {
    cbRef.current = cb;
  });

  useEffect(() => {
    cbRef.current();
    const onFocus = () => cbRef.current();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
}
