import type { Metadata } from "next";
import "./globals.css";
import "./extensions.css";
import "./refresh.css";
import "./admin-dashboard.css";
import "./card-loading.css";
import "./donation-wizard.css";

export const metadata: Metadata = {
  title: "Direct Aid Burundi — Ensemble, agir au plus près",
  description: "Soutenez les actions de Direct Aid Burundi : orphelins, puits d’eau, colis alimentaires et sacrifices à distance.",
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
      {/* Browser extensions may inject attributes on body before React hydrates. */}
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
