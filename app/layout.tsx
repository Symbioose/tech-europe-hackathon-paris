import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crucible — Watch the agent learn",
  description:
    "Crucible simulates your launch in a virtual market. 7 tribes. 70 buyers. 3 learning rounds. One decision.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
