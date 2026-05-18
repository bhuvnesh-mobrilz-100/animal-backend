import AuthProvider from "@/providers/AuthProvider";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import HydrationLoaderRemover from "@/components/HydrationLoader";
import AnimatedLogo from "@/components/AnimatedLogo";
import 'sweetalert2/src/sweetalert2.scss'
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://animalclick.co.za/'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">{children}</div>
          <HydrationLoaderRemover />
          <div id="site-loader" className="loader-content">
            <AnimatedLogo />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
