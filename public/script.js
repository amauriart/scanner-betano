const btn = document.getElementById('btn');
const status = document.getElementById('status');
const results = document.getElementById('results');

btn.addEventListener('click', load);

async function load(){
  status.innerText = 'Buscando odds na Betano...';
  results.innerHTML = '';
  try{
    const r = await fetch('/odds');
    if(!r.ok) throw new Error('Falha no servidor: ' + r.status);
    const items = await r.json();

    const now = Date.now();
    const limit = now + 24*60*60*1000;
    const games = new Map();

    items.forEach(it=>{
      if(!it.home || !it.away) return;
      let st = it.start_time ? Date.parse(it.start_time) : null;
      if(st && (st <= now || st > limit)) return;
      const key = it.home + '|' + it.away;
      if(!games.has(key)) games.set(key, { home: it.home, away: it.away, competition: it.competition||'', country: it.country||'', start_time: it.start_time||'', over05: null, over15: null });
      const g = games.get(key);
      if(/Over 0.5/i.test(it.market) && typeof it.odd === 'number') g.over05 = it.odd;
      if(/Over 1.5/i.test(it.market) && typeof it.odd === 'number') g.over15 = it.odd;
    });

    const list05 = [];
    const list15 = [];
    for(const [k,g] of games){
      if(g.over05 !== null && g.over05 >= 1.10) list05.push(g);
      if(g.over15 !== null && g.over15 >= 1.50) list15.push(g);
    }

    list05.sort((a,b)=>b.over05 - a.over05);
    list15.sort((a,b)=>b.over15 - a.over15);

    renderGroup('Over 0.5 (≥ 1.10)', list05, 'over05');
    renderGroup('Over 1.5 (≥ 1.50)', list15, 'over15');

    status.innerText = `Pronto — encontrados ${list05.length} over0.5 e ${list15.length} over1.5`;
  }catch(err){
    console.error(err);
    status.innerText = 'Erro: ' + err.message;
  }
}

function renderGroup(title, list, field){
  const div = document.createElement('div');
  div.className = 'group';
  const h = document.createElement('h3'); h.innerText = title; div.appendChild(h);
  if(list.length===0){ const p = document.createElement('p'); p.innerText = 'Nenhum jogo encontrado.'; div.appendChild(p); results.appendChild(div); return; }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Jogo</th><th>Campeonato</th><th>Odd</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  list.forEach(g=>{
    const tr = document.createElement('tr');
    const time = g.start_time ? new Date(g.start_time).toLocaleString('pt-BR') : '';
    tr.innerHTML = `<td><b>${g.home} x ${g.away}</b><div class="small">${time} — ${g.country}</div></td><td>${g.competition}</td><td>${field==='over05'?g.over05.toFixed(2):g.over15.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  div.appendChild(table);
  results.appendChild(div);
}
