import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-heading' });

export const metadata: Metadata = {
  title: "Conductor Platform | Perform Digital",
  description: "Enterprise Agentic Execution Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${inter.className} ${outfit.variable}`}>
        <div className="noise-overlay"></div>
        {children}
      </body>
    </html>
  );
}
