"use client";

import { useEffect } from "react";

export default function HydrationLoaderRemover() {
  useEffect(() => {
    const loader = document.getElementById("site-loader");
    if (loader) {
      loader.classList.add("shrink-out");
    }
  }, []);

  return null;
}
