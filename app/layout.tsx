import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Direct Aid Burundi — Ensemble, agir au plus près",
  description: "Soutenez les actions de Direct Aid Burundi : orphelins, puits d’eau, colis alimentaires et sacrifices à distance.",
  other: {
    "codex-preview": "development",
  },
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
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
