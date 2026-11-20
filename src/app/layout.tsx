import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const ethnocentric = localFont({
  src: "../../public/fonts/ethnocentric.woff",
  variable: "--font-ethnocentric",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Snag — QA & PM Agent",
  description: "Audit a B2B SaaS product, triage bugs, and prioritize the PM action plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${ethnocentric.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
