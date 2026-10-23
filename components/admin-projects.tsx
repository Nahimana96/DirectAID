"use client";

import {Droplets, Plus} from 'lucide-react';
import {money, type Project} from '@/lib/domain';
import {Button} from './ui/button';

export function AdminProjects({projects, busy, onCreate, onEdit, onDelete}: {
  projects: Project[];
  busy: boolean;
  onCreate: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  return <>
    <div className="section-toolbar"><div><h2>Vos projets de puits.</h2><p>Créez chaque puits une seule fois. Choisissez ensuite s’il apparaît aussi dans « Nos campagnes ».</p></div><Button onClick={onCreate}><Plus size={18} aria-hidden="true"/>Créer un puits</Button></div>
    {projects.length ? <div className="content-grid admin-project-list">{projects.map(project => <article className="story-card" key={project.id}>
      <img className="story-cover" src={project.cover ? `/api/media/${project.cover}` : '/action-puits.webp'} alt="" loading="lazy"/>
      <div className="story-body">
        <span className="badge">{project.published ? 'Publié' : 'Brouillon'}</span>
        <h3>{project.title}</h3>
        <p>{project.location} · {money(project.collected)} reçus / {money(project.goal)}</p>
        <p className="fineprint">{project.show_in_campaigns ? 'Affiché dans Nos campagnes' : 'Absent de Nos campagnes'}</p>
        <div className="admin-project-actions"><Button variant="outline" onClick={() => onEdit(project)}>Modifier</Button><Button variant="outline" disabled={busy} onClick={() => onDelete(project)}>Supprimer</Button></div>
        {project.published && <a className="text-link" href={`/actions/puits?lang=fr#puits-projets`} target="_blank" rel="noreferrer">Voir les puits publiés</a>}
      </div>
    </article>)}</div> : <div className="admin-panel empty-state"><Droplets aria-hidden="true"/><h3>Votre premier puits</h3><p>Créez une fiche avec son objectif, son lieu et sa photo.</p></div>}
  </>;
}
