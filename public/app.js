'use strict';
const $=id=>document.getElementById(id);
const agentNames={claim:'Claim Extractor',cross:'Cross-Modal Alignment',video:'Video Forensics',image:'Image Forensics',source:'Source Credibility',scam:'Scam & Persuasion',fact:'Factual Veracity'};
let mode='text',files=[],report=null,busy=false;
const human=s=>String(s||'').replace(/_/g,' ');
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function initialAgents(){
  $('agents').replaceChildren();
  Object.entries(agentNames).forEach(([id,name],i)=>{const card=el('article',undefined,'agent-card');card.append(el('span','0'+(i+1),'agent-number'),el('h3',name),el('span','NOT RUN','status'),el('p','Awaiting submitted evidence.'));card.dataset.agent=id;$('agents').append(card);});
}
initialAgents();
async function health(){
  try{const r=await fetch('/api/health');if(!r.ok)throw Error();const d=await r.json();$('system').textContent='System ready';$('capability-note').textContent=d.capabilities.grounded_text?'Live evidence retrieval configured. Media models: unavailable.':'Text model not configured. Measured media signals are available; verdicts may remain uncertain.';}
  catch{$('system').textContent='Service unavailable';$('capability-note').textContent='Unable to reach the analysis service.';}
}
health();
const accepts={text:'',image:'image/png,image/jpeg,image/webp,image/gif,image/tiff',video:'video/mp4,video/webm,video/quicktime,video/x-msvideo',document:'application/pdf,image/png,image/jpeg',multimodal:'image/*,video/mp4,video/webm,audio/*,application/pdf'};
function setMode(value){if(busy)return;mode=value;files=[];renderFiles();$('files').value='';document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.mode===mode)));$('text-group').hidden=!['text','multimodal'].includes(mode);$('file-group').hidden=mode==='text';$('files').accept=accepts[mode];$('files').multiple=mode==='multimodal';$('formats').textContent=mode==='video'?'MP4, WebM, MOV, AVI · up to 120 seconds':mode==='document'?'PDF or image scan · first 10 pages':mode==='multimodal'?'One file per modality · 12 MB combined':'PNG, JPEG, WebP, GIF, TIFF · 12 MB combined';}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelector('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-mode]')],i=tabs.indexOf(document.activeElement);const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();setMode(tabs[next].dataset.mode);});
$('claim').addEventListener('input',()=>{$('count').textContent=$('claim').value.length.toLocaleString()+' / 40,000';});
function renderFiles(){ $('file-list').replaceChildren();files.forEach((f,i)=>{const li=el('li'),remove=el('button','Remove');remove.type='button';remove.setAttribute('aria-label','Remove '+f.name);remove.addEventListener('click',()=>{if(!busy){files.splice(i,1);renderFiles();}});li.append(el('span',f.name+' · '+(f.size/1024/1024).toFixed(2)+' MB'),remove);$('file-list').append(li);});}
function addFiles(list){if(busy)return;files=mode==='multimodal'?[...files,...list]:[...list].slice(0,1);renderFiles();}
$('files').addEventListener('change',e=>addFiles(e.target.files));
$('dropzone').addEventListener('dragover',e=>{e.preventDefault();$('dropzone').classList.add('drag');});
$('dropzone').addEventListener('dragleave',()=>$('dropzone').classList.remove('drag'));
$('dropzone').addEventListener('drop',e=>{e.preventDefault();$('dropzone').classList.remove('drag');addFiles(e.dataTransfer.files);});
function base64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(Error('Could not read '+file.name));reader.readAsDataURL(file);});}
function showError(message){$('error').hidden=false;$('error').textContent=message;}
function statusCard(id,a){
  const card=el('article',undefined,'agent-card');card.append(el('h3',a.agent||agentNames[id]),el('span',human(a.status),'status'));card.querySelector('.status').dataset.state=a.status;
  card.append(el('p',human(a.verdict)));
  if(a.claims)card.append(el('p',a.claims.length+' claims'));
  if(a.ocr_confidence!==null&&a.ocr_confidence!==undefined)card.append(el('p','OCR confidence: '+Math.round(a.ocr_confidence*100)+'% (text extraction only)'));
  if(a.model)card.append(el('p','Method: '+a.model));
  if(a.signals?.length){const details=el('details');details.append(el('summary','View '+a.signals.length+' measured signals / observations'),el('pre',JSON.stringify(a.signals,null,2)));card.append(details);}
  if(a.claims?.length){const details=el('details');details.append(el('summary','View claims'));a.claims.forEach(c=>details.append(el('p',c.text+(c.verdict?' — '+human(c.verdict):''))));card.append(details);}
  return card;
}
function render(r){
  report=r;$('result-summary').hidden=false;$('empty-summary').hidden=true;$('busy-summary').hidden=true;
  $('verdict').textContent=human(r.final_verdict);$('reasoning').textContent=r.reasoning;
  $('summary-metrics').replaceChildren();
  for(const [name,value] of [['Confidence',r.confidence===null?'Not calibrated':Math.round(r.confidence*100)+'%'],['Evidence',human(r.evidence_quality)],['Processing time',(r.total_processing_time_ms/1000).toFixed(1)+' s']]){const row=el('div');row.append(el('dt',name),el('dd',value));$('summary-metrics').append(row);}
  $('dimensions').replaceChildren();Object.entries(r.dimensions).forEach(([k,v])=>{const row=el('div',undefined,'dimension');row.append(el('span',human(k)),el('strong',human(v)));$('dimensions').append(row);});
  $('agents').replaceChildren();$('auxiliary').replaceChildren();
  Object.keys(agentNames).forEach(id=>$('agents').append(statusCard(id,r.agent_results[id])));
  for(const id of ['audio','document'])if(r.agent_results[id]?.applicable)$('auxiliary').append(statusCard(id,r.agent_results[id]));
  const c=r.agent_consensus;$('agent-count').textContent=c.completed+' completed · '+c.insufficient+' insufficient evidence · '+c.inactive+' not applicable · '+c.failed+' failed';
  $('evidence-empty').hidden=true;$('evidence-content').replaceChildren();
  for(const [title,items] of [['Supporting evidence',r.supporting_evidence],['Contradicting evidence',r.contradicting_evidence],['Other sources',Object.values(r.agent_results).flatMap(a=>a.evidence||[]).filter(e=>!['SUPPORTS','CONTRADICTS'].includes(e.relationship))]]){
    if(!items.length)continue;const group=el('section',undefined,'evidence-group');group.append(el('h3',title));
    items.forEach(e=>{const card=el('article',undefined,'source-card');try{const url=new URL(e.url);if(['https:','http:'].includes(url.protocol)){const a=el('a',e.title||e.source||url.hostname);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}}catch{}card.append(el('p',e.excerpt),el('small',[e.source,e.published_date,e.relationship].filter(Boolean).join(' · ')));if(e.reason)card.append(el('p',e.reason));group.append(card);});$('evidence-content').append(group);
  }
  const group=el('section',undefined,'evidence-group');group.append(el('h3','Limitations & unavailable analysis'));const ul=el('ul',undefined,'limitations');(r.limitations||[]).forEach(s=>ul.append(el('li',s)));
  Object.values(r.agent_results).filter(a=>a.applicable).forEach(a=>(a.limitations||[]).forEach(s=>ul.append(el('li',a.agent+': '+s))));group.append(ul);$('evidence-content').append(group);
  const suggestions=r.agent_results.fact?.search_suggestions;if(suggestions){const iframe=el('iframe',undefined,'search-suggestions');iframe.title='Google search suggestions';iframe.setAttribute('sandbox','allow-popups');iframe.srcdoc=suggestions;$('evidence-content').append(iframe);}
  $('download').hidden=false;
}
$('investigate').addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;$('error').hidden=true;
  let timer;
  try{
    if(files.reduce((s,f)=>s+f.size,0)>12*1024*1024)throw Error('Combined files exceed 12 MB.');
    const payload={text:['text','multimodal'].includes(mode)?$('claim').value.trim():'',url:$('source-url').value.trim()};
    for(const f of files){
      const type=mode==='document'?'document':f.type.startsWith('image/')?'image':f.type.startsWith('video/')?'video':f.type.startsWith('audio/')?'audio':f.type==='application/pdf'?'document':null;
      if(!type)throw Error('Unsupported file: '+f.name);const key=type+'_base64';if(payload[key])throw Error('Submit one '+type+' file per investigation.');payload[key]=await base64(f);
    }
    if(!payload.text&&!payload.url&&!files.length)throw Error('Add text, a source URL or a file first.');
    busy=true;$('submit').disabled=true;$('download').hidden=true;$('empty-summary').hidden=true;$('result-summary').hidden=true;$('busy-summary').hidden=false;
    $('agents').replaceChildren();Object.entries(agentNames).forEach(([id,name])=>$('agents').append(statusCard(id,{agent:name,status:'PENDING_REPORT',verdict:'Awaiting server result'})));
    $('auxiliary').replaceChildren();$('evidence-content').replaceChildren();$('evidence-empty').hidden=false;$('evidence-empty').textContent='Waiting for this investigation’s evidence.';report=null;
    const started=Date.now();timer=setInterval(()=>$('elapsed').textContent=Math.round((Date.now()-started)/1000)+' seconds elapsed',1000);
    const response=await fetch('/api/investigate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(240000)});
    let data;try{data=await response.json();}catch{throw Error('The server returned an unreadable response.');}
    if(!response.ok)throw Error((data.error?.message||'Investigation failed.')+(data.request_id?' Request ID: '+data.request_id:''));
    render(data);
  }catch(err){showError(err.name==='TimeoutError'?'The request timed out; completion could not be confirmed.':err.message);$('busy-summary').hidden=true;$('empty-summary').hidden=false;initialAgents();}
  finally{busy=false;$('submit').disabled=false;if(timer)clearInterval(timer);}
});
$('download').addEventListener('click',()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='truthguard-'+report.investigation_id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
