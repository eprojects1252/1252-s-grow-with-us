import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sri Amirthaa | Everyday Shopping, Made Better",
  description: "Discover electronics, fashion, home essentials and more at Sri Amirthaa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
