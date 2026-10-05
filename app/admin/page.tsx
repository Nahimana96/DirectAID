import {redirect} from 'next/navigation';
import {administrator} from '@/lib/auth';
import Admin from '@/components/admin';
export const dynamic='force-dynamic';
export default async function AdminPage(){try{await administrator();}catch{redirect('/admin/connexion');}return <Admin/>;}
