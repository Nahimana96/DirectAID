"use client";
import {useState} from 'react';
import {Mail} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from './ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from './ui/dialog';
import {api,humanError} from './public-site';

type Payload={id:string;assets:string[];message:string;key:string};
type Preview={recipient:string;from:string;subject:string;html:string;blocker:string|null;payload:Payload};
export function ProofEmailPreview({id,assets,message,disabled,onSent}:{id:string;assets:string[];message:string;disabled:boolean;onSent:()=>Promise<void>}){
 const [preview,setPreview]=useState<Preview|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function open(){
  setBusy(true);setError('');
  try{const payload={id,assets:assets.slice(0,12),message,key:crypto.randomUUID()};const result=await api('admin',{action:'previewProof',...payload});setPreview({...result,payload});}
  catch(e){toast.error(humanError((e as Error).message));}finally{setBusy(false);}
 }
 async function send(){
  if(!preview||busy)return;
  setBusy(true);setError('');
  try{
   const result=await api('admin',{action:'proof',...preview.payload});
   if(result.emailStatus==='sent'){toast.success('E-mail confié au service d’envoi.');setPreview(null);}
   else setError(result.emailStatus==='failed'?`L’envoi a échoué : ${result.emailError||'erreur du service e-mail'}. Vous pouvez réessayer dans l’onglet E-mails.`:'Le message est encore en attente d’envoi. Consultez l’onglet E-mails.');
   await onSent();
  }catch(e){setError(humanError((e as Error).message));}finally{setBusy(false);}
 }
 return <><Button disabled={disabled||busy||!assets.length} onClick={open}><Mail size={17}/>{busy&&!preview?'Préparation…':'Prévisualiser l’e-mail avec les photos'}</Button>
  <Dialog open={!!preview} onOpenChange={value=>{if(!value&&!busy)setPreview(null);}}><DialogContent className="proof-email-dialog">
   <DialogHeader><DialogTitle>Aperçu de l’e-mail</DialogTitle><DialogDescription>Vérifiez le message et les photos avant l’envoi. Le rendu peut varier légèrement selon la messagerie du destinataire.</DialogDescription></DialogHeader>
   {preview&&<><div className="proof-email-addresses"><p><strong>À :</strong> {preview.recipient}</p><p><strong>De :</strong> {preview.from||'Adresse d’expédition à configurer'}</p><p><strong>Objet :</strong> {preview.subject}</p></div>
    <iframe title="E-mail reçu par le donateur" sandbox="" referrerPolicy="no-referrer" srcDoc={preview.html}/>
    {preview.blocker&&<p className="form-error" role="status">{preview.blocker}</p>}{error&&<p className="form-error" role="alert">{error}</p>}
    <DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setPreview(null)}>Retour au message</Button><Button disabled={busy||!!preview.blocker||!!error} onClick={send}><Mail size={17}/>{busy?'Envoi…':'Confirmer l’envoi'}</Button></DialogFooter></>}
  </DialogContent></Dialog></>;
}
