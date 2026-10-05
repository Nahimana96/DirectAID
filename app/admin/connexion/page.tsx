import AdminLogin from '@/components/admin-login';
import {administrator} from '@/lib/auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function AdminConnexionPage(){let signedIn=false;try{await administrator();signedIn=true;}catch{}if(signedIn)redirect('/admin');return <AdminLogin/>;}
