import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const displayFont = localFont({
  src: "./fonts/Bahnschrift.ttf",
  variable: "--font-heading",
});

const bodyFont = localFont({
  src: [
    {
      path: "./fonts/SegoeUI-Light.ttf",
      style: "normal",
      weight: "300",
    },
    {
      path: "./fonts/SegoeUI-Regular.ttf",
      style: "normal",
      weight: "400",
    },
    {
      path: "./fonts/SegoeUI-Bold.ttf",
      style: "normal",
      weight: "700",
    },
  ],
  variable: "--font-body",
});

const monoFont = localFont({
  src: [
    {
      path: "./fonts/Consolas-Regular.ttf",
      style: "normal",
      weight: "400",
    },
    {
      path: "./fonts/Consolas-Bold.ttf",
      style: "normal",
      weight: "700",
    },
  ],
  variable: "--font-code",
});

export const metadata: Metadata = {
  title: {
    default: "TCB-3 | Human-led fitness coaching platform",
    template: "%s | TCB-3",
  },
  description:
    "TCB-3 connects clients with real professional trainers through profile discovery, package-based coaching, and media-rich communication.",
  applicationName: "TCB-3",
  keywords: [
    "fitness coaching platform",
    "personal trainer marketplace",
    "online fitness coaching",
    "trainer packages",
    "client trainer chat",
  ],
  openGraph: {
    title: "TCB-3",
    description:
      "A production-oriented platform connecting clients with real professional trainers.",
    siteName: "TCB-3",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TCB-3",
    description:
      "Connect with real professional trainers through package-based coaching relationships.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
