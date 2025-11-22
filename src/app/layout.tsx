import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RaiseMed OS",
  description: "Internal SaaS/ERP for managing Google Business Profile optimization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
