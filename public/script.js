async function carregar() {
  const div = document.getElementById("conteudo");
  div.innerHTML = "Carregando...";

  try {
    const url = "https://www.betano.com/api/sport/events?sport=football&prefix=true";
    const resp = await fetch(`/proxy?url=${encodeURIComponent(url)}`);
    const data = await resp.json();

    div.innerHTML = "";

    let jogos = (data.events || []).filter(j => j.status === "not_started");

    const agora = Date.now();
    jogos = jogos.filter(j => {
      const inicio = new Date(j.startTime).getTime();
      return inicio - agora <= 24 * 60 * 60 * 1000 && inicio > agora;
    });

    let lista05 = [];
    let lista15 = [];

    jogos.forEach(jogo => {
      const markets = jogo.markets || [];
      const o05 = markets.find(m => m.key === "over_under_05");
      const o15 = markets.find(m => m.key === "over_under_15");

      if (o05 && o05.selections?.[0]?.price >= 1.10) {
        lista05.push({
          campeonato: jogo.competition,
          times: jogo.home + " vs " + jogo.away,
          odd: o05.selections[0].price
        });
      }

      if (o15 && o15.selections?.[0]?.price >= 1.50) {
        lista15.push({
          campeonato: jogo.competition,
          times: jogo.home + " vs " + jogo.away,
          odd: o15.selections[0].price
        });
      }
    });

    lista05.sort((a,b)=>b.odd - a.odd);
    lista15.sort((a,b)=>b.odd - a.odd);

    div.innerHTML += "<h2>Over 0.5 (>= 1.10)</h2>";
    div.innerHTML += gerarTabela(lista05);

    div.innerHTML += "<h2>Over 1.5 (>= 1.50)</h2>";
    div.innerHTML += gerarTabela(lista15);

  } catch (e) {
    console.error(e);
    div.innerHTML = "Erro ao carregar.";
  }
}

function gerarTabela(lista) {
  if (lista.length === 0) return "Nenhum jogo encontrado<br>";

  let html = `<table class='table'><tr><th>Jogo</th><th>Campeonato</th><th>Odd</th></tr>`;
  lista.forEach(j => {
    html += `<tr>
      <td>${j.times}</td>
      <td>${j.campeonato}</td>
      <td><b>${j.odd}</b></td>
    </tr>`;
  });
  html += "</table>";
  return html;
}
