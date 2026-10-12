import AdminLogin from '@/components/admin-login';
import {PageLoadingScreen} from '@/components/page-loading-screen';
import {administrator} from '@/lib/auth';
import {redirect} from 'next/navigation';
import '../../page-loading.css';
export const dynamic='force-dynamic';
export default async function AdminConnexionPage(){let signedIn=false;try{await administrator();signedIn=true;}catch{}if(signedIn)redirect('/admin');return <><PageLoadingScreen/><div id="admin-login-content"><AdminLogin/></div><noscript><style>{'.page-loading-screen{display:none}'}</style></noscript></>;}
