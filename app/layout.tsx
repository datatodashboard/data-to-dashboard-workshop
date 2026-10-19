import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQL for Data Analysis | Data to Dashboard",
  description:
    "Join Ramgokul Jeyakumar for a focused 3-hour live SQL workshop on 13 September 2026.",
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
