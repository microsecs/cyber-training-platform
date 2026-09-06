import type { ReactNode } from "react";
import Script from "next/script";

export default function OutlookAddinLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Script
        src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}
