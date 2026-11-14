import type { Metadata } from 'next';

export const siteUrl = 'https://www.directaidburundi.org';

const pages = {
  '': ['Direct Aid Burundi — Aide humanitaire au Burundi', 'Soutenez les actions de Direct Aid Burundi : aide aux enfants orphelins, accès à l’eau potable, colis alimentaires et sacrifices solidaires.'],
  association: ['Notre association', 'Découvrez la mission et les actions de Direct Aid Burundi auprès des enfants et des familles au Burundi.'],
  campagnes: ['Campagnes de solidarité au Burundi', 'Consultez les campagnes de Direct Aid Burundi et choisissez le projet que vous souhaitez soutenir.'],
  realisations: ['Nos réalisations au Burundi', 'Découvrez les actions réalisées par Direct Aid Burundi et les photos des projets menés sur le terrain.'],
  donner: ['Faire un don pour le Burundi', 'Soutenez les actions de Direct Aid Burundi avec un don ponctuel ou mensuel.'],
  'actions/orphelins': ['Soutenir les enfants orphelins au Burundi', 'Contribuez à un programme collectif qui soutient l’alimentation, l’éducation et les soins des enfants orphelins au Burundi.'],
  'actions/puits': ['Financer un puits d’eau potable au Burundi', 'Découvrez les projets de puits de Direct Aid Burundi et contribuez à l’accès à l’eau potable.'],
  'actions/colis': ['Offrir un colis alimentaire au Burundi', 'Soutenez la distribution de colis alimentaires aux familles au Burundi avec Direct Aid Burundi.'],
  'actions/sacrifices': ['Sacrifices solidaires au Burundi', 'Organisez un sacrifice à distance et soutenez la distribution de viande aux familles au Burundi.'],
  temoignages: ['Témoignages', 'Retrouvez les témoignages publiés par Direct Aid Burundi.'],
  contact: ['Contacter Direct Aid Burundi', 'Retrouvez les coordonnées de Direct Aid Burundi pour poser vos questions sur les dons et les actions de l’association.'],
  faq: ['Questions fréquentes', 'Trouvez les réponses aux questions sur les dons, les actions et le suivi des contributions à Direct Aid Burundi.'],
  confidentialite: ['Politique de confidentialité', 'Découvrez comment Direct Aid Burundi traite les données liées aux dons et au suivi des contributions.'],
  'mentions-legales': ['Mentions légales', 'Consultez les mentions légales du site de Direct Aid Burundi.'],
  'conditions-dons': ['Conditions des dons', 'Consultez les conditions applicables aux dons à Direct Aid Burundi.'],
} satisfies Record<string, [string, string]>;

export const indexablePaths = Object.keys(pages);

export function pageMetadata(path: string): Metadata {
  if (!Object.hasOwn(pages, path)) return { robots: { index: false, follow: false } };

  const [label, description] = pages[path as keyof typeof pages];
  const title = path ? label + ' | Direct Aid Burundi' : label;
  const url = new URL('/' + path, siteUrl).href;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Direct Aid Burundi', type: 'website' },
  };
}
