import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { SoundToggle } from "@/components/SoundToggle";
import { KeyboardHelp } from "@/components/KeyboardHelp";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#f0f9ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "3moji - The fun way to learn words",
  description:
    "Interactive educational game where kids find emojis matching the words.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-X8B5CLPKL4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-X8B5CLPKL4');
          `}
        </Script>
        <div className="fixed top-4 right-4 z-50">
          <SoundToggle />
        </div>
        <KeyboardHelp />
        {children}
      </body>
    </html>
  );
}
