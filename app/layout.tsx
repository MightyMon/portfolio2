import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mighty. — goutham o shibu · devsecops & cybersecurity",
  description:
    "instrumented systems. measured loops. portfolio of goutham o shibu ('mighty') — devsecops engineer & cybersecurity specialist, kerala/in.",
  openGraph: {
    title: "mighty. — portfolio of goutham o shibu",
    description: "instrumented systems. measured loops. — you are the traffic.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
