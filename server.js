'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const orchestrator=require('./engine/orchestrator');
const {fault}=require('./engine/result');
const {MAX_FILE}=require('./engine/input');
const VERSION='3.0.0';
const MAX_BODY=Math.ceil(MAX_FILE/3)*4+100000;
const TTL=60*60*1000;
function createServer({engine=orchestrator,reportTTL=TTL,rateLimit=30}={}){
  const reports=new Map(),rates=new Map(),secret=crypto.randomBytes(32);
  let active=0;
  const sign=id=>crypto.createHmac('sha256',secret).update(id).digest('hex');
  function session(req,res){
    const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('tg_session='))?.slice(11)||'';
    const [id,signature]=token.split('.');
    if(/^[a-f0-9]{64}$/.test(id||'')&&/^[a-f0-9]{64}$/.test(signature||'')&&crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(sign(id)))) return id;
    const fresh=crypto.randomBytes(32).toString('hex');
    res.setHeader('Set-Cookie','tg_session='+fresh+'.'+sign(fresh)+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600'+(process.env.NODE_ENV==='production'?'; Secure':''));
    return fresh;
  }
  const cleanup=setInterval(()=>{const now=Date.now();for(const [id,r] of reports)if(r.expires<now)reports.delete(id);for(const [ip,r]of rates)if(r.expires<now)rates.delete(ip);},60000).unref();
  const server=http.createServer(async(req,res)=>{
    const requestId=crypto.randomUUID();
    res.setHeader('X-Request-ID',requestId);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const send=(status,data)=>{if(!res.writableEnded){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}};
    try{
      const url=new URL(req.url,'http://localhost');
      const pathname=url.pathname;
      if(req.method==='GET'&&(pathname==='/health'||pathname==='/api/health')) return send(200,{status:'ready',version:VERSION,capabilities:{grounded_text:Boolean(engine.provider?.configured),semantic_alignment:Boolean(engine.provider?.configured),image_pixel_analysis:true,video_frame_analysis:true,audio_signal_analysis:true,document_extraction:true,validated_deepfake_models:false},retention_minutes:reportTTL/60000});
      const owner=session(req,res);
      if(req.method==='GET'&&['/','/index.html','/dashboard','/app.js','/styles.css'].includes(pathname)){
        const file=pathname==='/app.js'?'app.js':pathname==='/styles.css'?'styles.css':'index.html';
        const body=await fs.readFile(path.join(__dirname,'public',file));
        res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8'});return res.end(body);
      }
      if(req.method==='GET'&&pathname.startsWith('/api/investigation/')){
        const match=/^\/api\/investigation\/([a-f0-9-]{36})(?:\/(agents|evidence))?$/.exec(pathname);
        const record=match&&reports.get(match[1]);
        if(!record||record.owner!==owner||record.expires<Date.now())return send(404,{error:{code:'NOT_FOUND',message:'Investigation not found or expired.'},request_id:requestId});
        const report=record.report;
        return send(200,match[2]==='agents'?report.agent_results:match[2]==='evidence'?Object.values(report.agent_results).flatMap(r=>r.evidence||[]):report);
      }
      const routes=['/api/investigate','/analyze','/api/analyze/image','/api/analyze/video','/api/analyze/document','/api/analyze/claim','/api/analyze/cross','/api/analyze/source','/api/analyze/scam','/api/analyze/veracity','/api/analyze/audio'];
      if(req.method!=='POST'||!routes.includes(pathname))return send(404,{error:{code:'NOT_FOUND',message:'Route not found.'},request_id:requestId});
      if(req.headers.origin){
        let origin;try{origin=new URL(req.headers.origin);}catch{throw fault('FORBIDDEN_ORIGIN','Invalid request origin.');}
        if(origin.host!==req.headers.host||!['http:','https:'].includes(origin.protocol))throw fault('FORBIDDEN_ORIGIN','Cross-origin requests are not allowed.');
      }
      const ip=req.socket.remoteAddress||'unknown',now=Date.now();
      let rate=rates.get(ip);if(!rate||rate.expires<now){rate={count:0,expires:now+60000};rates.set(ip,rate);}
      if(++rate.count>rateLimit){res.setHeader('Retry-After','60');return send(429,{error:{code:'RATE_LIMIT',message:'Too many requests. Retry in a minute.'},request_id:requestId});}
      if(active>=1)return send(429,{error:{code:'BUSY',message:'The analysis queue is full. Try again shortly.'},request_id:requestId});
      if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(415,{error:{code:'CONTENT_TYPE',message:'Send application/json.'},request_id:requestId});
      if(Number(req.headers['content-length'])>MAX_BODY)return send(413,{error:{code:'PAYLOAD_TOO_LARGE',message:'Upload limit is 12 MB.'},request_id:requestId});
      active++;
      try{
        let size=0,chunks=[];
        for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw fault('PAYLOAD_TOO_LARGE','Upload limit is 12 MB.');chunks.push(chunk);}
        let payload;try{payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fault('INVALID_JSON','The request body is not valid JSON.');}
        const required={'/api/analyze/image':'image_base64','/api/analyze/video':'video_base64','/api/analyze/document':'document_base64','/api/analyze/audio':'audio_base64','/api/analyze/source':'url','/api/analyze/claim':'text','/api/analyze/scam':'text','/api/analyze/veracity':'text'}[pathname];
        if(required&&!payload?.[required])throw fault('EMPTY_INPUT','This endpoint requires '+required+'.');
        const report=await engine.analyze(payload);
        report.request_id=requestId;
        if(reports.size>=200)reports.delete(reports.keys().next().value);
        reports.set(report.investigation_id,{owner,report,expires:Date.now()+reportTTL});
        console.info(JSON.stringify({event:'investigation',request_id:requestId,investigation_id:report.investigation_id,elapsed_ms:report.total_processing_time_ms,agents:Object.values(report.agent_results).map(a=>({agent:a.id,status:a.status,model:a.model,confidence:a.confidence,evidence_count:a.evidence.length,error:a.error||null,execution_time_ms:a.execution_time_ms}))}));
        return send(200,report);
      }finally{active--;}
    }catch(e){
      const status=e.code==='PAYLOAD_TOO_LARGE'?413:e.code==='FORBIDDEN_ORIGIN'?403:e.publicMessage?400:500;
      console.error(JSON.stringify({event:'request_error',request_id:requestId,code:e.code||'INTERNAL_ERROR'}));
      return send(status,{error:{code:e.code||'INTERNAL_ERROR',message:e.publicMessage||'The request failed. Use the request ID to report it.'},request_id:requestId});
    }
  });
  server.requestTimeout=30000;server.headersTimeout=15000;
  server.on('close',()=>clearInterval(cleanup));
  return server;
}
if(require.main===module){const server=createServer();server.listen(Number(process.env.PORT)||8080,'0.0.0.0',()=>console.log('TruthGuard '+VERSION+' ready'));const shutdown=()=>server.close(()=>process.exit(0));process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);}
module.exports={createServer,MAX_BODY,VERSION};
