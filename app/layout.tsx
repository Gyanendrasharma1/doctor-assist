import "./globals.css";
import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import { SessionProvider } from "next-auth/react";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Doctor AI Assistant",
  description: "Premium medical memory assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={oswald.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
