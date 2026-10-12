import type {Locale} from '@/lib/domain';

export function CardsSkeleton({locale,variant='projects'}:{locale:Locale;variant?:'projects'|'stories'}){
 const label=locale==='en'?'Loading cards…':locale==='ar'?'جارٍ تحميل البطاقات…':'Chargement des cartes…';
 return <div className={`${variant==='projects'?'projects-grid':'content-grid'} card-skeleton-grid`} role="status" aria-live="polite" aria-busy="true">
  <span className="sr-only">{label}</span>
  {[0,1,2].map(i=><div className="card-skeleton" aria-hidden="true" key={i}>
   <div className="card-placeholder card-skeleton-photo"/>
   <div className="card-skeleton-body">
    <span className="card-placeholder card-skeleton-badge"/>
    <span className="card-placeholder card-skeleton-title"/>
    <span className="card-placeholder card-skeleton-title short"/>
    <span className="card-placeholder card-skeleton-meta"/>
    <span className="card-placeholder card-skeleton-link"/>
    {variant==='projects'&&<><span className="card-placeholder card-skeleton-progress"/><span className="card-placeholder card-skeleton-button"/></>}
   </div>
  </div>)}
 </div>;
}
