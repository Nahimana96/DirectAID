import { today, type Locale } from './domain';
import type { ContentEntry } from './editorial-model';

export function activeCampaigns(entries: ContentEntry[], day = today()) {
  return entries.filter(entry => entry.kind === 'campaign' && entry.published &&
    entry.start <= day && entry.end >= day && entry.collected < entry.goal);
}

export function campaignDonationUrl(entry: ContentEntry, locale: Locale) {
  const query = new URLSearchParams({ lang: locale, cause: entry.cause, campaign: entry.id });
  if (entry.projectId) query.set('project', entry.projectId);
  return `/donner?${query}`;
}
