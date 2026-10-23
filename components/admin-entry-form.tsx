"use client";

import {useRef, useState, type FormEvent} from 'react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Textarea} from './ui/textarea';
import {Field} from './public-site';
import {entrySchema, type ContentEntry, type Localized} from '@/lib/editorial-model';
import {today} from '@/lib/domain';

export type EntryDraft = Omit<ContentEntry, 'id' | 'collected'> & {id?: string; collected?: number};
type Errors = Record<string, string>;
type Upload = (file: File, document?: boolean) => Promise<{id: string} | undefined>;
type Mutate = (value: unknown, onFailure?: (code: string) => void) => Promise<boolean>;

function FieldError({message}: {message?: string}) {
  return message ? <span className="entry-field-error" role="alert">{message}</span> : null;
}

function LocalizedEntryField({label, value, onChange, multiline = false, errors, path}: {
  label: string;
  value: Localized;
  onChange: (value: Localized, locale: keyof Localized) => void;
  multiline?: boolean;
  errors: Errors;
  path: 'title' | 'description';
}) {
  const Control = multiline ? Textarea : Input;
  const translationError = Boolean(errors[`${path}.en`] || errors[`${path}.ar`]);
  return <fieldset className="localized-field entry-localized-field">
    <legend>{label}</legend>
    <Field label="Français"><Control value={value.fr} aria-invalid={Boolean(errors[`${path}.fr`])} onChange={event => onChange({...value, fr: event.target.value}, 'fr')}/><FieldError message={errors[`${path}.fr`]}/></Field>
    <details open={translationError || undefined}>
      <summary>Traductions anglaise et arabe</summary>
      <Field label="Anglais"><Control value={value.en} aria-invalid={Boolean(errors[`${path}.en`])} onChange={event => onChange({...value, en: event.target.value}, 'en')}/><FieldError message={errors[`${path}.en`]}/></Field>
      <Field label="Arabe"><Control dir="rtl" value={value.ar} aria-invalid={Boolean(errors[`${path}.ar`])} onChange={event => onChange({...value, ar: event.target.value}, 'ar')}/><FieldError message={errors[`${path}.ar`]}/></Field>
    </details>
  </fieldset>;
}

function errorText(path: string, message: string) {
  if (message !== 'Required' && !message.startsWith('Expected') && !message.startsWith('Too ')) return message;
  if (path === 'goal') return 'Indiquez un objectif entre 1 € et 1 000 000 €.';
  if (path === 'projectId') return 'Choisissez un projet de puits publié.';
  if (path === 'start') return 'Choisissez une date de début valide.';
  if (path === 'end') return 'Choisissez une date de fin valide.';
  if (path === 'date') return 'Choisissez une date de réalisation valide.';
  if (path === 'location') return 'Indiquez un lieu valide.';
  if (path === 'images') return 'Vérifiez les photos ajoutées.';
  if (path.startsWith('title.')) return 'Ce titre est trop long.';
  if (path.startsWith('description.')) return 'Ce texte est trop long.';
  return 'Vérifiez ce champ.';
}

export function AdminEntryForm({draft, campaign, projects, upload, mutate, busy, onChange, onDone, onCreateProject, onEditProject, onDeleteProject}: {
  draft: EntryDraft;
  campaign: boolean;
  projects: Array<{id: string; title: string; published: number | boolean}>;
  upload: Upload;
  mutate: Mutate;
  busy: boolean;
  onChange: (draft: EntryDraft) => void;
  onDone: () => void;
  onCreateProject?: () => void;
  onEditProject?: (id: string) => void;
  onDeleteProject?: (id: string, title: string) => void;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);

  function update(changes: Partial<EntryDraft>, ...paths: string[]) {
    onChange({...draft, ...changes});
    setErrors(previous => {
      const next = {...previous};
      for (const path of paths) delete next[path];
      delete next.form;
      return next;
    });
  }

  function showErrors(next: Errors) {
    setErrors(next);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry = {...draft};
    delete entry.collected;
    const result = entrySchema.safeParse(entry);
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] === 'images' ? 'images' : issue.path.join('.');
        if (path && !next[path]) next[path] = errorText(path, issue.message);
      }
      showErrors(next);
      return;
    }
    setErrors({});
    const saved = await mutate({action: 'content', entry: result.data}, code => {
      if (code === 'PROJECT_UNAVAILABLE') showErrors({projectId: 'Ce projet de puits n’est plus disponible. Choisissez un autre puits publié.'});
      else if (code === 'INVALID_ASSET') showErrors({images: 'Une photo n’est plus disponible. Retirez-la et ajoutez-la de nouveau.'});
      else if (code === 'CAMPAIGN_HAS_DONATIONS') showErrors({cause: 'Cette campagne a déjà reçu des dons : son action ou son puits ne peut plus être modifié.'});
      else showErrors({form: 'L’enregistrement a échoué. Vérifiez les champs indiqués et réessayez.'});
    });
    if (saved) onDone();
  }

  return <form ref={formRef} noValidate className="admin-panel settings-section entry-editor" onSubmit={submit}>
    <div className="section-toolbar"><h2>{draft.id ? 'Modifier' : 'Créer'} {campaign ? 'une campagne' : 'une réalisation'}</h2><Button type="button" variant="outline" onClick={onDone}>Retour à la liste</Button></div>
    {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
    <LocalizedEntryField label="Titre" path="title" value={draft.title} errors={errors} onChange={(value, locale) => update({title: value}, `title.${locale}`)}/>
    <LocalizedEntryField label={campaign ? 'Présentation de la campagne' : 'Bilan de l’action'} path="description" value={draft.description} multiline errors={errors} onChange={(value, locale) => update({description: value}, `description.${locale}`)}/>
    <div className="two-fields">
      <Field label="Action concernée"><select value={draft.cause} aria-invalid={Boolean(errors.cause)} onChange={event => update({cause: event.target.value as EntryDraft['cause'], projectId: null}, 'cause', 'projectId')}>
        {([['orphelins', 'Orphelins'], ['puits', 'Puits d’eau'], ['colis', 'Colis alimentaires'], ['sacrifices', 'Sacrifices']] as const).filter(([value]) => value !== 'puits' || !campaign || (draft.id && draft.cause === 'puits')).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select><FieldError message={errors.cause}/></Field>
      <Field label="Lieu / village"><Input value={draft.location} aria-invalid={Boolean(errors.location)} onChange={event => update({location: event.target.value}, 'location')}/><FieldError message={errors.location}/></Field>
    </div>
    {campaign ? <>
      <div className="two-fields">
        <Field label="Date de début"><Input type="date" value={draft.start} aria-invalid={Boolean(errors.start)} onChange={event => update({start: event.target.value}, 'start', 'end')}/><FieldError message={errors.start}/></Field>
        <Field label="Date de fin"><Input type="date" min={draft.start} value={draft.end} aria-invalid={Boolean(errors.end)} onChange={event => update({end: event.target.value}, 'end')}/><FieldError message={errors.end}/></Field>
      </div>
      <Field label="Objectif de collecte (€)"><Input type="number" min={1} step="0.01" max={1000000} value={draft.goal / 100} aria-invalid={Boolean(errors.goal)} onChange={event => update({goal: Math.round(Number(event.target.value) * 100)}, 'goal')}/><FieldError message={errors.goal}/></Field>
      {draft.cause === 'puits' && draft.id && <>
        <Field label="Projet de puits lié"><select value={draft.projectId || ''} aria-invalid={Boolean(errors.projectId)} onChange={event => update({projectId: event.target.value || null}, 'projectId')}>
          <option value="">Choisir un puits publié</option>{projects.filter(project => project.published).map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select><FieldError message={errors.projectId}/></Field>
        <div className="campaign-project-actions">{onCreateProject && <Button type="button" variant="outline" disabled={busy} onClick={onCreateProject}>Créer un puits</Button>}{draft.projectId && onEditProject && <Button type="button" variant="outline" disabled={busy} onClick={() => onEditProject(draft.projectId!)}>Modifier le puits lié</Button>}{draft.projectId && onDeleteProject && <Button type="button" variant="outline" disabled={busy} onClick={() => onDeleteProject(draft.projectId!, projects.find(project => project.id === draft.projectId)?.title || 'Ce puits')}>Supprimer le puits lié</Button>}</div>
        {projects.some(project => !project.published) && <details className="campaign-project-drafts"><summary>Puits en brouillon</summary>{projects.filter(project => !project.published).map(project => <div key={project.id}><span>{project.title}</span>{onEditProject && <Button type="button" variant="outline" onClick={() => onEditProject(project.id)}>Modifier</Button>}{onDeleteProject && <Button type="button" variant="outline" onClick={() => onDeleteProject(project.id, project.title)}>Supprimer</Button>}</div>)}</details>}
        <p className="fineprint">Après la création, publiez le puits puis sélectionnez-le dans la liste ci-dessus.</p>
      </>}
    </> : <Field label="Date de réalisation"><Input type="date" max={today()} value={draft.date} aria-invalid={Boolean(errors.date)} onChange={event => update({date: event.target.value}, 'date')}/><FieldError message={errors.date}/></Field>}
    <Field label="Ajouter une photo (4 Mo max., 12 photos maximum)"><Input disabled={busy || draft.images.length >= 12} type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={Boolean(errors.images)} onChange={async event => {const file = event.target.files?.[0]; if (file) {const asset = await upload(file); if (asset) update({images: [...draft.images, asset.id]}, 'images');} event.target.value = '';}}/><FieldError message={errors.images}/></Field>
    <div className="editor-photos">{draft.images.map((id, index) => <div key={id}><img src={'/api/media/' + id} alt={'Photo ' + (index + 1)}/><Button type="button" variant="ghost" onClick={() => update({images: draft.images.filter(image => image !== id)}, 'images')}>Retirer</Button></div>)}</div>
    {draft.images.length > 0 && <label className="check-field entry-check-field" data-invalid={Boolean(errors.imageConsent)}><input type="checkbox" checked={draft.imageConsent} aria-invalid={Boolean(errors.imageConsent)} onChange={event => update({imageConsent: event.target.checked}, 'imageConsent')}/><span>L’association autorise la diffusion publique de ces images.<FieldError message={errors.imageConsent}/></span></label>}
    <label className="check-field"><input type="checkbox" checked={draft.published} onChange={event => update({published: event.target.checked}, 'imageConsent')}/>Publier sur le site</label>
    <p className="fineprint">{campaign ? 'La collecte utilise les paiements confirmés. Une campagne hors période reste consultable sans proposer de nouveau don.' : 'Seuls les contenus publiés apparaissent sur le site.'}</p>
    <Button className="button green" type="submit" disabled={busy}>{busy ? 'Enregistrement…' : draft.published ? 'Enregistrer et publier' : 'Enregistrer le brouillon'}</Button>
  </form>;
}
