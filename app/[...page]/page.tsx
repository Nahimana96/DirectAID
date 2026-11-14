import { notFound } from 'next/navigation';
import PublicSite from '@/components/public-site';
import { indexablePaths, pageMetadata } from '@/lib/seo';

const privatePaths = ['espace-donateur', 'suivi', 'merci'];

type Props = { params: Promise<{ page: string[] }> };

export async function generateMetadata({ params }: Props) {
  const { page } = await params;
  return pageMetadata(page.join('/'));
}

export default async function Page({ params }: Props) {
  const { page } = await params;
  const path = page.join('/');
  if (!indexablePaths.includes(path) && !privatePaths.includes(path)) notFound();
  return <PublicSite path={path} />;
}
