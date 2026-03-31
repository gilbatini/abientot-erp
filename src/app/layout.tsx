import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300","400","500","600","700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300","400","500","600"],
});

export const metadata: Metadata = {
  title: "AlgoriOffice — À Bientôt Tour & Travels",
  description: "Business operations platform by Algorivia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
