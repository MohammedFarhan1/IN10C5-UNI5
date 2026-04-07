import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { getCurrentSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "uni5",
  description: "A demo marketplace for unit-level product tracking"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await getCurrentSession();

  return (
    <html lang="en">
      <body>
        <Navbar email={profile?.email} role={profile?.role} />
        <main>{children}</main>
      </body>
    </html>
  );
}
