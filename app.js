(()=>{
  const calendar = document.getElementById('calendar')
  const monthLabel = document.getElementById('monthLabel')
  const prev = document.getElementById('prev'), next = document.getElementById('next')
  const dayTitle = document.getElementById('dayTitle'), eventsList = document.getElementById('eventsList')
  const eventForm = document.getElementById('eventForm')
  const titleInput = document.getElementById('title'), timeInput = document.getElementById('time'), descInput = document.getElementById('desc')
  const exportBtn = document.getElementById('export'), importBtn = document.getElementById('import'), importFile = document.getElementById('importFile')
  const usernameInput = document.getElementById('username'), loginBtn = document.getElementById('login'), currentUserSpan = document.getElementById('currentUser')

  const API = 'http://localhost:3000'
  let view = new Date()
  let selectedDate = null
  let currentUser = JSON.parse(localStorage.getItem('sf_user')||'null')

  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
  function iso(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate()).toISOString().slice(0,10)}

  function setUser(u){currentUser = u; localStorage.setItem('sf_user', JSON.stringify(u)); currentUserSpan.textContent = u?('Signed in: '+u.name):''}
  if(currentUser) setUser(currentUser)

  async function api(path, opts){
    try{const res = await fetch(API+path, Object.assign({headers:{'Content-Type':'application/json'}}, opts)); const txt = await res.text(); try{ return JSON.parse(txt)}catch(e){return txt}}catch(e){return {error:'server_unreachable'}}
  }

  async function createUserIfNeeded(name){ if(!name) return null; if(currentUser && currentUser.name===name) return currentUser; const res = await api('/users',{method:'POST',body:JSON.stringify({name})}); if(res && res.id) { setUser(res); return res } return null }

  async function fetchEvents(month){ const q = month?('?month='+month):''; const res = await api('/events'+q); if(Array.isArray(res)) return res; return [] }

  async function renderCalendar(d=new Date()){
    calendar.innerHTML=''
    const year = d.getFullYear(), month = d.getMonth()
    monthLabel.textContent = d.toLocaleString(undefined,{month:'long',year:'numeric'})
    const first = new Date(year,month,1), last = new Date(year,month+1,0)
    const start = new Date(first); start.setDate(first.getDate()-first.getDay())
    const end = new Date(last); end.setDate(last.getDate()+(6-last.getDay()))
    const monthKey = d.toISOString().slice(0,7)
    const events = await fetchEvents(monthKey)
    for(let cur=new Date(start); cur<=end; cur.setDate(cur.getDate()+1)){
      const day = document.createElement('div'); day.className='day'
      if(cur.getMonth()!==month) day.classList.add('otherMonth')
      const dateNum = document.createElement('div'); dateNum.className='date'; dateNum.textContent = cur.getDate()
      day.appendChild(dateNum)
      const dayKey = iso(cur)
      const dayEvents = events.filter(e=>e.date===dayKey)
      if(dayEvents.length) day.classList.add('hasEvent')
      day.addEventListener('click',()=>selectDay(new Date(cur)))
      calendar.appendChild(day)
    }
  }

  async function selectDay(d){selectedDate = new Date(d); dayTitle.textContent = selectedDate.toDateString(); await renderEvents();}

  function escapeHtml(s){if(!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

  async function renderEvents(){eventsList.innerHTML=''; if(!selectedDate) return; const events = await fetchEvents(selectedDate.toISOString().slice(0,7)); const dayEvents = events.filter(e=>e.date===iso(selectedDate)).sort((a,b)=> (a.time||'') > (b.time||'')?1:-1)
    if(dayEvents.length===0) eventsList.textContent='No events for this day.'
    for(const e of dayEvents){const el = document.createElement('div'); el.className='event'; const joined = currentUser && e.attendees && e.attendees.includes(currentUser.id); el.innerHTML = `<strong>${escapeHtml(e.title)}</strong> ${e.time?'<span class="time">'+e.time+'</span>':''}<div>${escapeHtml(e.desc||'')}</div><div class="small">${joined?'<em>Joined</em>':'<button data-id="'+e.id+'" class="join">Join</button>'} <button data-id="${e.id}" class="share">Share</button></div>`; eventsList.appendChild(el)}
    Array.from(eventsList.querySelectorAll('.join')).forEach(b=>b.addEventListener('click',async ev=>{const id=ev.target.dataset.id; if(!currentUser) return alert('Sign in first'); const res = await api('/events/'+id+'/join',{method:'POST',body:JSON.stringify({userId:currentUser.id})}); if(res && res.id) { alert('Joined'); renderCalendar(view); renderEvents() } else alert('Failed to join')}))
    Array.from(eventsList.querySelectorAll('.share')).forEach(b=>b.addEventListener('click',ev=>{const id=ev.target.dataset.id; const url = location.origin + location.pathname + '#event=' + id; navigator.clipboard?.writeText(url); alert('Share link copied to clipboard') }))
  }

  eventForm.addEventListener('submit',async e=>{e.preventDefault(); if(!selectedDate) return alert('Select a day first'); if(!currentUser) return alert('Sign in first'); const payload = {title:titleInput.value,date:iso(selectedDate),time:timeInput.value,desc:descInput.value,creatorId:currentUser.id}; const res = await api('/events',{method:'POST',body:JSON.stringify(payload)}); if(res && res.id){ titleInput.value=''; timeInput.value=''; descInput.value=''; renderCalendar(view); renderEvents() } else { alert('Failed to create event (server)') } })

  prev.addEventListener('click',()=>{view.setMonth(view.getMonth()-1); renderCalendar(view)})
  next.addEventListener('click',()=>{view.setMonth(view.getMonth()+1); renderCalendar(view)})

  exportBtn.addEventListener('click',()=>{ alert('Use the server export in future'); })
  importBtn.addEventListener('click',()=>importFile.click())

  loginBtn.addEventListener('click',async ()=>{ const name = usernameInput.value.trim(); if(!name) return alert('Enter a name'); const user = await createUserIfNeeded(name); if(user) alert('Signed in as '+user.name); renderCalendar(view); renderEvents() })

  function tryOpenFromHash(){if(location.hash.startsWith('#event=')){const id = location.hash.split('=')[1]; // fetch and open
    api('/events/'+id).then(ev=>{ if(ev && ev.date){ const parts = ev.date.split('-'); const d=new Date(parts[0],parts[1]-1,parts[2]); view = new Date(d); renderCalendar(view).then(()=>selectDay(d)) } }) }
  }

  // init
  renderCalendar(view)
  tryOpenFromHash()

})();
