import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lindström — kampaně",
  description: "Přehled běžících online marketingových kampaní",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className="h-full antialiased">
      <body
        className="min-h-full"
        style={{ background: "var(--background)" }}
      >
        {children}
      </body>
    </html>
  );
}
