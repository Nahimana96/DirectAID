import PublicSite from '@/components/public-site';
export default async function Page({params}:{params:Promise<{page:string[]}>}){const p=await params;return <PublicSite path={p.page.join('/')}/>;}
