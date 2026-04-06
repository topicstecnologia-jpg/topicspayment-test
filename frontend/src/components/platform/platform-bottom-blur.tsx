"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function PlatformBottomBlur() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(<div className="platform-bottom-blur" aria-hidden="true" />, document.body);
}
