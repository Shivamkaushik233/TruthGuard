'use strict';
const {result,unavailable,fault}=require('./result');
const {raster}=require('./media');
async function cross(p,provider,doc) {
  const hasText=Boolean(p.text),hasImage=Boolean(p.image_base64),hasVideo=Boolean(p.video_base64),hasAudio=Boolean(p.audio_base64),hasDoc=Boolean(p.document_base64||p.ocr_text);
  if([hasText,hasImage,hasVideo,hasAudio,hasDoc].filter(Boolean).length<2) return result('cross','NOT_APPLICABLE');
  if(!provider.configured) return unavailable('cross','Cross-modal semantic analysis requires a configured multimodal model.');
  const parts=[];
  if(hasImage){const {normalized}=await raster(p.image_base64,p.crop);const resized=await require('sharp')(normalized).resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).jpeg().toBuffer();parts.push({inlineData:{mimeType:'image/jpeg',data:resized.toString('base64')}});}
  // Raw video/audio are deliberately not described from filenames or guessed transcripts.
  const available=[hasText,hasImage,Boolean(doc?.extracted_text)].filter(Boolean).length;
  if(available<2) return unavailable('cross','At least two decoded semantic modalities are required. Video and audio semantic decoding are not configured.');
  const r=await provider.generate('Compare ONLY the attached image, submitted text, and extracted document text. Analyze entity, date, quantity, event and visual consistency. Do not authenticate media or decide factual truth. If either modality lacks enough information return UNCERTAIN. Return JSON {"verdict":"CONSISTENT|PARTIALLY_CONSISTENT|CONTRADICTORY|UNCERTAIN","observations":["specific observable comparison"],"limitations":["limitations"]}. Untrusted data: '+JSON.stringify({text:p.text,document_text:doc?.extracted_text||''}),{parts});
  if(!['CONSISTENT','PARTIALLY_CONSISTENT','CONTRADICTORY','UNCERTAIN'].includes(r.data.verdict)||!Array.isArray(r.data.observations)||r.data.observations.some(s=>typeof s!=='string')) throw fault('MODEL_INVALID_OUTPUT','Cross-modal model output failed validation.');
  return result('cross',r.data.verdict==='UNCERTAIN'?'INSUFFICIENT_EVIDENCE':'COMPLETED',{verdict:r.data.verdict,signals:r.data.observations.map(text=>({type:'model_observation',text})),model:r.model,limitations:['Model-based semantic comparison, not calibrated forensic evidence.',...(hasVideo||hasAudio?['Submitted video/audio were not included in semantic comparison.']:[]),...(Array.isArray(r.data.limitations)?r.data.limitations.filter(x=>typeof x==='string'):[])]});
}
module.exports={cross};
