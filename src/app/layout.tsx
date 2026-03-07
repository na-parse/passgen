import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const archivo = localFont({
  variable: "--font-archivo",
  display: "swap",
  src: [
    {
      path: "./fonts/archivo-latin.woff2",
      style: "normal",
      weight: "400 700",
    },
  ],
});

const archivoBlack = localFont({
  variable: "--font-archivo-black",
  display: "swap",
  src: [
    {
      path: "./fonts/archivo-black-latin.woff2",
      style: "normal",
      weight: "400",
    },
  ],
});

const firaCode = localFont({
  variable: "--font-fira-code",
  display: "swap",
  src: [
    {
      path: "./fonts/fira-code-latin.woff2",
      style: "normal",
      weight: "400 700",
    },
  ],
});

export const metadata: Metadata = {
  title: "passgen - simple secure password generator",
  description: "Personal web app to convert a python script I was using into a web-based anywhere/anytime application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${archivoBlack.variable} ${firaCode.variable}`}
      >
        <noscript>
          <div className="pg-noscript-banner">
            <strong>JavaScript required.</strong> passgen runs locally in your
            browser. Allow scripts for this site and reload to generate passwords.
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
