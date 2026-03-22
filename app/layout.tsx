import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signal",
  description: "Signal gives you a focused edge."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
