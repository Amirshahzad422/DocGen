import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian DocGen",
  description: "Legal document generator for Meridian Legal Group",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
