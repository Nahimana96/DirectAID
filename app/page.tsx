import PublicSite from '@/components/public-site';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('');

export default function Home() {
  return <PublicSite />;
}
