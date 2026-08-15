import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "CyberAware | Employee Security Training",
  description: "Cybersecurity awareness training for businesses and employees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
