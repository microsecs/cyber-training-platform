import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
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
      <body>
        <SiteNav />
        <RoleAccessGate>{children}</RoleAccessGate>
      </body>
    </html>
  );
}
