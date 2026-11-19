import { list, del } from '@vercel/blob';

const backupPrefix = 'directaid-backups/';
const archiveFile = /^directaid-backups\/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-f0-9-]{36})\/(database\.enc|manifest\.json|assets\/[a-f0-9-]{36}\.enc)$/;

// A manifest is uploaded last, once the database and every asset are stored.
export function retentionPlan(blobs, keep = 7) {
  if (!Number.isInteger(keep) || keep < 1) throw new Error('Invalid backup retention count');
  const archives = new Map();
  for (const blob of blobs) {
    const match = archiveFile.exec(blob.pathname);
    if (!match) continue;
    const [, id, filename] = match;
    if (!archives.has(id)) archives.set(id, { id, complete: false, files: [] });
    const archive = archives.get(id);
    archive.files.push(blob);
    if (filename === 'manifest.json') archive.complete = true;
  }
  const complete = [...archives.values()]
    .filter(archive => archive.complete && archive.files.some(file => file.pathname.endsWith('/database.enc')))
    .sort((a, b) => b.id.localeCompare(a.id));
  const retained = complete.slice(0, keep).map(archive => archive.id);
  // Only prune once there are enough complete backups. Include leftover files
  // from older failed runs, so interrupted deletions can be retried safely.
  const cutoff = retained.length === keep ? retained.at(-1) : null;
  const removed = cutoff ? [...archives.values()].filter(archive => archive.id < cutoff) : [];
  return { retained, removed, files: removed.flatMap(archive => archive.files) };
}

export async function pruneBackups(token) {
  if (!token) throw new Error('Backup storage token required');
  let cursor;
  const blobs = [];
  do {
    const page = await list({ token, prefix: backupPrefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const plan = retentionPlan(blobs);
  for (const archive of plan.removed) {
    // Keep the completion marker until this archive's other files are gone.
    const manifest = archive.files.filter(file => file.pathname.endsWith('/manifest.json'));
    const files = archive.files.filter(file => !file.pathname.endsWith('/manifest.json'));
    for (let offset = 0; offset < files.length; offset += 100) {
      await del(files.slice(offset, offset + 100).map(file => file.url), { token });
    }
    if (manifest.length) await del(manifest.map(file => file.url), { token });
  }
  return { retained: plan.retained, removedArchives: plan.removed.length, removedFiles: plan.files.length };
}
