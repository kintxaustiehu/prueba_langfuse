const http = require('http')
const fs = require('fs')
const path = require('path')
const DATA_FILE = path.join(__dirname, 'data.json')
const port = process.env.PORT || 3000

function load(){
  try{const s = fs.readFileSync(DATA_FILE,'utf8'); return JSON.parse(s)}catch(e){return {users:[],events:[]}}
}

function save(db){fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2))}

function sendJSON(res, obj, status=200){res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(obj))}

function parseBody(req){return new Promise((res,rej)=>{let s=''; req.on('data',c=>s+=c); req.on('end',()=>{ try{res(s?JSON.parse(s):{})}catch(e){rej(e)} }); req.on('error',rej) })}

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}

const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url, `http://${req.headers.host}`)
  const db = load()
  // CORS
  res.setHeader('Access-Control-Allow-Origin','*')
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers','Content-Type')
  if(req.method==='OPTIONS'){res.writeHead(204); return res.end()}

  // Routes
  if(url.pathname === '/users' && req.method==='POST'){
    try{const body = await parseBody(req); if(!body.name) return sendJSON(res,{error:'name required'},400); const user = {id:uid(),name:body.name}; db.users.push(user); save(db); return sendJSON(res,user,201)}catch(e){return sendJSON(res,{error:'invalid'},400)}
  }

  if(url.pathname === '/events' && req.method==='GET'){
    // optional month=YYYY-MM
    const month = url.searchParams.get('month')
    if(month){ const filtered = db.events.filter(ev=>ev.date.startsWith(month)); return sendJSON(res,filtered)}
    return sendJSON(res,db.events)
  }

  if(url.pathname === '/events' && req.method==='POST'){
    try{const body = await parseBody(req); if(!body.title||!body.date||!body.creatorId) return sendJSON(res,{error:'title,date,creatorId required'},400); const e = {id:uid(),title:body.title,date:body.date,time:body.time||'',desc:body.desc||'',creatorId:body.creatorId,attendees:[body.creatorId]}; db.events.push(e); save(db); return sendJSON(res,e,201)}catch(e){return sendJSON(res,{error:'invalid'},400)}
  }

  const eventMatch = url.pathname.match(/^\/events\/(.+)\/?$/)
  if(eventMatch){ const id = eventMatch[1]
    if(req.method==='GET'){ const ev = db.events.find(x=>x.id===id); if(!ev) return sendJSON(res,{error:'not found'},404); return sendJSON(res,ev)}
    if(req.method==='POST'){
      // join: POST /events/:id/join
      if(url.pathname.endsWith('/join')){
        try{const body = await parseBody(req); if(!body.userId) return sendJSON(res,{error:'userId required'},400); const ev = db.events.find(x=>x.id===id); if(!ev) return sendJSON(res,{error:'not found'},404); if(!ev.attendees.includes(body.userId)) ev.attendees.push(body.userId); save(db); return sendJSON(res,ev)}catch(e){return sendJSON(res,{error:'invalid'},400)}
      }
    }
  }

  // fallback
  res.writeHead(404, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:'not found'}))
})

server.listen(port, ()=>{console.log('Server listening on http://localhost:'+port)})
