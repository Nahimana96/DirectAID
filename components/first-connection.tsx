'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {LockKeyhole} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {api} from './public-site';
export function FirstConnection(){
 const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');
 async function submit(event:FormEvent){event.preventDefault();setError('');setBusy(true);try{await api('auth/first',{email});setSent(true);}catch(e){const code=(e as Error).message;setError(code==='TOO_MANY_ATTEMPTS'?'Trop de demandes. Réessayez dans 15 minutes.':code==='EMAIL_NOT_CONFIGURED'?'L’envoi des liens n’est pas configuré sur ce site local. Contactez l’administrateur principal.':code==='EMAIL_DOMAIN_REQUIRED'?'Resend limite l’adresse d’expédition de test. L’association doit vérifier son domaine dans Resend pour envoyer ce lien à un autre utilisateur.':'L’envoi du lien a échoué. Réessayez plus tard ou contactez l’administrateur principal.');}finally{setBusy(false);}}
 return <main className="admin-login-page"><section className="admin-login-card"><div className="admin-login-icon"><LockKeyhole aria-hidden="true"/></div><p className="eyebrow">DIRECT AID BURUNDI</p><h1>Première connexion</h1><p className="admin-login-lead">Votre adresse doit avoir été ajoutée par l’administrateur principal.</p>{sent?<p role="status" className="note">Si votre adresse figure parmi les comptes invités, vous recevrez un lien valable 15 minutes pour créer votre mot de passe.</p>:<form className="access-form" onSubmit={submit}><label className="field"><span>Votre adresse e-mail</span><Input type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)}/></label>{error&&<p className="form-error" role="alert">{error}</p>}<Button className="button green" type="submit" disabled={busy}>{busy?'Envoi…':'Recevoir mon lien'}</Button></form>}<Link className="admin-login-back" href="/admin/connexion">Retour à la connexion</Link></section></main>;
}
