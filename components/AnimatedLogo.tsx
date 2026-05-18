// components/AnimatedLogo.tsx
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function AnimatedLogo() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true); // wait for hydration to use next/image
  }, []);

  return (
    <Image
      src="/images/Logo1024.png"
      alt="Vouch Logo"
      width={200}
      height={200}
      className="loader-logo"
      priority
    />
  );
}
