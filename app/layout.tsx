import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQL for Data Analysis | Data to Dashboard",
  description:
    "Join Ramgokul Jeyakumar for live SQL classes starting 14 November 2026, every Saturday and Sunday from 10:00 AM to 1:00 PM IST.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
