"use client";
import {useState,type FormEvent} from 'react';
import {LockKeyhole} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
export default function AdminLogin(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});if(!response.ok){setError(response.status===429?'Trop de tentatives. Réessayez dans 15 minutes.':'E-mail ou mot de passe incorrect.');return;}location.assign('/admin');}catch{setError('Connexion indisponible. Réessayez dans un instant.');}finally{setBusy(false);}}
 return <main className="admin-login-page"><section className="admin-login-card" aria-labelledby="admin-login-title"><div className="admin-login-icon"><LockKeyhole size={28}/></div><p className="eyebrow">DIRECT AID BURUNDI</p><h1 id="admin-login-title">Espace administrateur</h1><p className="admin-login-lead">Connectez-vous pour gérer l’association.</p><form onSubmit={submit}><div className="admin-login-fields"><label className="field"><span>E-mail</span><Input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Votre adresse e-mail" required maxLength={254}/></label><label className="field"><span>Mot de passe</span><Input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required maxLength={128}/></label></div>{error&&<p className="form-error" role="alert">{error}</p>}<Button type="submit" className="button green admin-login-submit" disabled={busy}>{busy?'Connexion…':'Se connecter'}</Button></form><a className="admin-login-back" href="/">Retour au site</a></section></main>;
}
