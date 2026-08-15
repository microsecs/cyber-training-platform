import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberAware | Employee Security Training",
  description: "Simple cybersecurity awareness training for businesses and employees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
