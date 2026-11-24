import type { Metadata } from "next";
import "./globals.css";
import "./extensions.css";
import "./refresh.css";
import "./admin-dashboard.css";
import "./card-loading.css";
import "./donation-wizard.css";
import "./water-action.css";
import "./modern-ui.css";
import "./qurban.css";
import "./admin-editorial.css";
import "./donation-model.css";
import "./rounded-controls.css";
import "./action-cards.css";

export const metadata: Metadata = {
  title: "Direct Aid Burundi — Ensemble, agir au plus près",
  description: "Soutenez les actions de Direct Aid Burundi : orphelins, puits d’eau, aide alimentaire et matérielle, et Qurban à distance.",
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
