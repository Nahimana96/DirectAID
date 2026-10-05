import { LockKeyhole } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { chatGPTSignInPath } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

export default function AdminConnexionPage() {
  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-icon"><LockKeyhole size={28} strokeWidth={1.8} /></div>
        <p className="eyebrow">DIRECT AID BURUNDI</p>
        <h1 id="admin-login-title">Espace administrateur</h1>
        <p className="admin-login-lead">Connectez-vous pour gérer les promesses de dons</p>
        <div className="admin-login-fields">
          <label className="field"><span className="sr-only">E-mail</span><Input type="email" placeholder="Email" disabled /></label>
          <label className="field"><span className="sr-only">Mot de passe</span><Input type="password" placeholder="Mot de passe" disabled /></label>
        </div>
        <Button asChild className="button green admin-login-submit"><a href={chatGPTSignInPath('/admin')}>Se connecter</a></Button>
        <p className="admin-login-note">L’accès est sécurisé avec votre compte autorisé.</p>
      </section>
    </main>
  );
}
