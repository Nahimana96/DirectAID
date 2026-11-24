"use client";

import {useLayoutEffect, useRef, useState, type PointerEvent} from 'react';
import {ChevronLeft, ChevronRight, Grip, Trash2} from 'lucide-react';

export function PhotoOrderEditor({images, onChange, disabled = false}: {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, {left: number; top: number}>());
  const current = useRef(images);
  current.current = images;
  const gesture = useRef<{id: string; x: number; y: number; width: number; target: string; active: boolean} | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [floating, setFloating] = useState<{x: number; y: number; width: number} | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useLayoutEffect(() => {
    const next = new Map<string, {left: number; top: number}>();
    const origin = grid.current?.getBoundingClientRect();
    grid.current?.querySelectorAll<HTMLElement>('[data-photo-id]').forEach(tile => {
      const id = tile.dataset.photoId!;
      const bounds = tile.getBoundingClientRect();
      const rect = {left: bounds.left - (origin?.left || 0), top: bounds.top - (origin?.top || 0)};
      const previous = positions.current.get(id);
      if (previous && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const x = previous.left - rect.left, y = previous.top - rect.top;
        if (x || y) tile.animate([{transform: `translate(${x}px, ${y}px)`}, {transform: 'translate(0, 0)'}], {duration: 220, easing: 'ease-out'});
      }
      next.set(id, rect);
    });
    positions.current = next;
  }, [images]);

  function move(id: string, target: number) {
    const next = [...current.current];
    const from = next.indexOf(id);
    if (from < 0 || target < 0 || target >= next.length || from === target) return;
    next.splice(from, 1);
    next.splice(target, 0, id);
    current.current = next;
    onChange(next);
    setAnnouncement(`Photo déplacée en position ${target + 1} sur ${next.length}.`);
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = gesture.current;
    if (!drag) return;
    if (!drag.active && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
    drag.active = true;
    setDragged(drag.id);
    setFloating({x: event.clientX, y: event.clientY, width: drag.width});
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-photo-id]');
    if (target && grid.current?.contains(target)) {
      drag.target = target.dataset.photoId!;
      setDropTarget(drag.target);
    }
  }

  function finish() {gesture.current = null; setDragged(null); setDropTarget(null); setFloating(null);}
  function drop() {
    const drag = gesture.current;
    if (drag?.active) move(drag.id, current.current.indexOf(drag.target));
    finish();
  }

  return <div className="photo-order-editor">
    {images.length > 1 && <p className="fineprint">Maintenez le clic sur une photo et déplacez-la pour changer l’ordre. La première sera la couverture. Vous pouvez aussi utiliser les flèches.</p>}
    <div className="editor-photos" ref={grid}>{images.map((id, index) => <div className={'editor-photo' + (dragged === id ? ' is-dragging' : '') + (dropTarget === id && dragged !== id ? ' is-drop-target' : '')} data-photo-id={id} key={id}>
      <button type="button" className="editor-photo-drag" disabled={disabled} aria-label={`Déplacer la photo ${index + 1}`} onPointerDown={event => {
        if (event.button !== 0) return;
        gesture.current = {id, x: event.clientX, y: event.clientY, width: event.currentTarget.clientWidth, target: id, active: false};
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={pointerMove} onPointerUp={drop} onPointerCancel={finish} onLostPointerCapture={finish}>
        <img draggable={false} src={'/api/media/' + id} alt={'Photo ' + (index + 1)}/>
        <span className="editor-photo-position">{index === 0 ? '1 · Couverture' : index + 1}</span><Grip className="editor-photo-grip" size={18} aria-hidden="true"/>
      </button>
      <div className="editor-photo-actions">
        <button type="button" disabled={disabled || index === 0} onClick={() => move(id, index - 1)} aria-label={`Avancer la photo ${index + 1}`}><ChevronLeft size={16}/></button>
        <button type="button" disabled={disabled || index === images.length - 1} onClick={() => move(id, index + 1)} aria-label={`Reculer la photo ${index + 1}`}><ChevronRight size={16}/></button>
        <button type="button" className="editor-photo-remove" disabled={disabled} onClick={() => onChange(images.filter(image => image !== id))}><Trash2 size={14} aria-hidden="true"/>Retirer</button>
      </div>
    </div>)}</div>
    {dragged && floating && <img className="editor-photo-floating" src={'/api/media/' + dragged} alt="" style={{left: floating.x, top: floating.y, width: floating.width}}/>}
    <span className="sr-only" role="status">{announcement}</span>
  </div>;
}
