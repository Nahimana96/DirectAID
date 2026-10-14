export function PageLoadingScreen(){
 return <div className="page-loading-screen" role="status" aria-live="polite" dir="ltr">
  <div className="page-loading-glow" aria-hidden="true"/>
  <div className="page-loading-content">
   <div className="page-loading-emblem"><span className="page-loading-orbit orbit-one" aria-hidden="true"/><span className="page-loading-orbit orbit-two" aria-hidden="true"/><img src="/logo-directaid.jpeg" alt="Direct Aid Burundi" width={100} height={100}/></div>
   <p className="page-loading-brand">DIRECT AID <span>BURUNDI</span></p>
   <p className="page-loading-title">Ensemble, au Burundi.</p>
   <div className="page-loading-line" aria-hidden="true"><span/></div>
   <p className="page-loading-caption">Chargement du tableau de bord…</p>
  </div>
 </div>;
}
