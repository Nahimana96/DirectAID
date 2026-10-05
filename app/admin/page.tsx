import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { administrator } from '@/lib/auth';
import Admin from '@/components/admin';
export const dynamic='force-dynamic';
export default async function AdminPage(){await requireChatGPTUser('/admin');try{await administrator();}catch{return <main className="section narrow"><h1 className="page-title">Accès réservé</h1><p>Ce compte n’est pas autorisé à gérer Direct Aid Burundi.</p><a href="/signout-with-chatgpt?return_to=/admin">Changer de compte</a></main>;}return <Admin/>;}
