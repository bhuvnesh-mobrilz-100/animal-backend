'use client';

import { PublicNav } from '@/components/PublicNav';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [])
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* <div className="sticky top-0 z-[51]">
        <PublicNav />
      </div>
      <main className="flex-1">
        {children}
      </main> */}
    </div>
  );
}