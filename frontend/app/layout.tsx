import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeCompass — Understand any codebase in minutes",
  description:
    "AI-powered developer onboarding. Paste a GitHub URL and get instant architecture insights, setup guides, and a chat interface.",
  keywords: ["developer onboarding", "AI", "codebase", "architecture", "GitHub"],
  openGraph: {
    title: "CodeCompass",
    description: "Understand any codebase in minutes, not days",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-zinc-900 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
