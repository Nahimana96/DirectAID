import { today, type Locale, type Project } from './domain';
import type { ContentEntry } from './editorial-model';

export type CampaignListing = ContentEntry & { source: 'campaign' | 'well'; stage?: string };

// A featured well is displayed as a campaign, but remains a single project in the database.
export function campaignListings(entries: ContentEntry[], projects: Project[]): CampaignListing[] {
  const featuredWells = projects.filter(project => project.published && project.show_in_campaigns);
  const featuredIds = new Set(featuredWells.map(project => project.id));
  const campaigns: CampaignListing[] = entries
    .filter(entry => entry.kind === 'campaign' && entry.published && (!entry.projectId || !featuredIds.has(entry.projectId)))
    .map(entry => ({...entry, source: 'campaign'}));
  const wells: CampaignListing[] = featuredWells.map(project => ({
    id: `well-${project.id}`,
    kind: 'campaign',
    source: 'well',
    stage: project.stage,
    title: {fr: project.title, en: project.title_en, ar: project.title_ar},
    description: {fr: project.description, en: project.description_en, ar: project.description_ar},
    cause: 'puits',
    location: project.location,
    date: '', start: '', end: '',
    goal: project.goal,
    projectId: project.id,
    images: project.cover ? [project.cover] : [],
    published: true,
    imageConsent: true,
    collected: project.collected,
  }));
  return [...campaigns, ...wells];
}

export function activeCampaignListings(entries: ContentEntry[], projects: Project[], day = today()) {
  return campaignListings(entries, projects).filter(entry => entry.collected < entry.goal &&
    (entry.source === 'well' ? entry.stage !== 'completed' : entry.start <= day && entry.end >= day));
}

export function activeCampaigns(entries: ContentEntry[], day = today()) {
  return entries.filter(entry => entry.kind === 'campaign' && entry.published &&
    entry.start <= day && entry.end >= day && entry.collected < entry.goal);
}

export function campaignDonationUrl(entry: ContentEntry | CampaignListing, locale: Locale) {
  if ('source' in entry && entry.source === 'well' && entry.projectId) {
    return `/donner?${new URLSearchParams({lang: locale, cause: 'puits', project: entry.projectId})}`;
  }
  const query = new URLSearchParams({ lang: locale, cause: entry.cause, campaign: entry.id });
  if (entry.projectId) query.set('project', entry.projectId);
  return `/donner?${query}`;
}
