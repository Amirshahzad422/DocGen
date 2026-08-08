import type { Metadata } from "next";
import "./globals.css";
import { ThemeInitializer } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  title: "Meridian DocGen",
  description: "Legal document generator for Meridian Legal Group",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
