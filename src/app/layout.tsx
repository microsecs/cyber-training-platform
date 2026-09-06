import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import RoleAccessGate from "@/components/RoleAccessGate";

export const metadata: Metadata = {
  title: "MicroSECONDS | Employee Security Training",
  description: "Cybersecurity awareness training for businesses and employees.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SiteNav />
        <div className="flex-1">
          <RoleAccessGate>{children}</RoleAccessGate>
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
