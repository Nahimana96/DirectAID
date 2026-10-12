import {notFound} from 'next/navigation';
import PublicSite from '@/components/public-site';
export default async function Page({params}:{params:Promise<{page:string[]}>}){const p=await params;if(p.page.length>1&&['realisations','campagnes'].includes(p.page[0]))notFound();return <PublicSite path={p.page.join('/')}/>;}
