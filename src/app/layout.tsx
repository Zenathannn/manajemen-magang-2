import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Manajemen Magang",
  description: "Aplikasi Manajemen Magang",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className={poppins.className}>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}