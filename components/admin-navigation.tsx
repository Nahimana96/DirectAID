"use client";

import {LayoutDashboard,Info,Images,Megaphone,HeartHandshake,Droplets,Mail,MessageSquare,Settings,ShieldCheck,ExternalLink,LogOut} from 'lucide-react';
import {TabsList,TabsTrigger} from './ui/tabs';
import {Button} from './ui/button';

export const adminSections=[
 {value:'tasks',label:'À traiter',title:'Vue d’ensemble',icon:LayoutDashboard},
 {value:'association',label:'À propos & FAQ',title:'À propos & FAQ',icon:Info},
 {value:'realisations',label:'Réalisations',title:'Réalisations',icon:Images},
 {value:'campaigns',label:'Campagnes',title:'Campagnes',icon:Megaphone},
 {value:'donations',label:'Dons & promesses',title:'Dons & promesses',icon:HeartHandshake},
 {value:'projects',label:'Projets de puits',title:'Projets de puits',icon:Droplets},
 {value:'emails',label:'E-mails',title:'E-mails',icon:Mail},
 {value:'testimonials',label:'Témoignages',title:'Témoignages',icon:MessageSquare},
 {value:'settings',label:'Réglages & photos',title:'Réglages & photos',icon:Settings},
 {value:'security',label:'Sécurité',title:'Sécurité',icon:ShieldCheck},
];

export function AdminAccount({email,onAccount,onLogout}:{email:string;onAccount:()=>void;onLogout:()=>void}){
 return <div className="admin-account-panel"><Button asChild variant="outline"><a href="/"><ExternalLink size={16} aria-hidden="true"/>Voir le site</a></Button><Button className="admin-account-avatar" aria-label="Mon compte" title="Mon compte" onClick={onAccount}>{email.slice(0,1).toUpperCase()}</Button><Button className="admin-logout-icon" variant="ghost" aria-label="Déconnexion" title="Déconnexion" onClick={onLogout}><LogOut size={19} aria-hidden="true"/></Button></div>;
}

export function AdminNavigation({open}:{open:boolean}){
 return <aside id="admin-sidebar" className="admin-sidebar" data-open={open}>
  <a className="brand" href="/"><img src="/logo-directaid.jpeg" alt=""/><span>Direct Aid<small>ADMINISTRATION</small></span></a>
  <div className="admin-navigation"><p className="admin-nav-caption">VOTRE ASSOCIATION</p><TabsList className="admin-sidebar-tabs" aria-label="Navigation de l’administration">{adminSections.map(({value,label,icon:Icon})=><TabsTrigger key={value} value={value}><Icon size={18} aria-hidden="true"/><span>{label}</span></TabsTrigger>)}</TabsList></div>
 </aside>;
}
