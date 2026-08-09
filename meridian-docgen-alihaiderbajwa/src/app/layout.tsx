import type { Metadata } from "next";
import "./globals.css";
import { ThemeInitializer } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  title: "Meridian DocGen",
  description: "Legal document generator for Meridian Legal Group",
};

const themeInitScript = `(function(){try{var s=window.localStorage.getItem("meridian-theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;if(s==="dark"||(s===null&&d)){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
