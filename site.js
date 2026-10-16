/* Liga dos Sócios DeLetra — gerado pelo painel DeLetra. Nao editar aqui: o original esta em site/ na pasta do painel. */
(function (CONFIG, CSS) {
'use strict';
/* Liga dos Socios DeLetra — a pagina dos patronos.
 *
 * Este ficheiro nao corre sozinho: o scripts/tilda.js mete-o dentro de
 *   (function (CONFIG, CSS) { ... })(config, estilos)
 * e publica o resultado como site.js no GitHub. O bloco do Tilda so tem um
 * carregador pequeno que vai buscar esse site.js — assim o bloco nunca chega
 * ao limite de caracteres do Tilda e as melhorias chegam sem colar nada.
 *
 * CONFIG: { titulo, competicao, fonte }  (fonte = endereco do dados.json)
 */

var raiz = document.getElementById('dlp');
if (!raiz || raiz.getAttribute('data-pronto')) return;     // nao montar duas vezes
raiz.setAttribute('data-pronto', '1');

if (!document.getElementById('dlp-estilo')) {
  var estilo = document.createElement('style');
  estilo.id = 'dlp-estilo';
  estilo.textContent = CSS;
  document.head.appendChild(estilo);
}

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

raiz.className = 'dlp';
raiz.innerHTML =
    '<div class="dlp-topo"><h2>' + esc(CONFIG.titulo) + '</h2>'
  + '<p class="dlp-sub">' + esc(CONFIG.competicao) + '</p></div>'
  + '<div class="dlp-premios" id="dlp-premios" hidden></div>'
  + '<div class="dlp-nav">'
  + '<button type="button" class="dlp-seta" data-passo="-1" aria-label="Jornada anterior">&#8249;</button>'
  + '<span class="dlp-etiqueta" id="dlp-jornada">Jornada</span>'
  + '<button type="button" class="dlp-seta" data-passo="1" aria-label="Jornada seguinte">&#8250;</button>'
  + '</div>'
  + '<div class="dlp-curiosidades" id="dlp-curiosidades" hidden></div>'
  + '<div class="dlp-abas" id="dlp-abas" role="tablist">'
  + '<button type="button" class="dlp-aba" data-aba="jogos" role="tab">Jogos</button>'
  + '<button type="button" class="dlp-aba" data-aba="semana" role="tab">Esta jornada</button>'
  + '<button type="button" class="dlp-aba" data-aba="mes" role="tab">Mês</button>'
  + '<button type="button" class="dlp-aba" data-aba="geral" role="tab">Geral</button>'
  + '</div>'
  + '<div class="dlp-procura" id="dlp-procura" hidden>'
  + '<span class="dlp-lupa"></span>'
  + '<input type="search" id="dlp-procurar" placeholder="Procura o teu nome" autocomplete="off"'
  + ' spellcheck="false" aria-label="Procurar um patrono pelo nome">'
  + '<button type="button" class="dlp-limpar" id="dlp-limpar" aria-label="Limpar a procura" hidden>&#10005;</button>'
  + '</div>'
  + '<div class="dlp-painel" data-painel="jogos">'
  + '<div class="dlp-scroll"><table class="dlp-tabela dlp-jogos"><tbody id="dlp-jogos"></tbody></table></div>'
  + '<p class="dlp-nota-pc" id="dlp-nota-pc" hidden></p>'
  + '</div>'
  + '<div class="dlp-painel" data-painel="semana" hidden>'
  + '<p class="dlp-dica">Carrega num nome para veres os palpites dessa semana.</p>'
  + '<div class="dlp-scroll"><table class="dlp-tabela">'
  + '<thead><tr><th></th><th>Patrono</th><th>Certos</th><th>Pontos</th></tr></thead>'
  + '<tbody id="dlp-semana"></tbody></table></div>'
  + '<div class="dlp-paginas" id="dlp-semana-nav"></div>'
  + '</div>'
  + '<div class="dlp-painel" data-painel="mes" hidden>'
  + '<h3 class="dlp-titulo" id="dlp-titulo-mes">Melhores do mês</h3>'
  + '<div class="dlp-scroll"><table class="dlp-tabela">'
  + '<thead><tr><th></th><th>Patrono</th><th>Certos</th><th>Pontos</th></tr></thead>'
  + '<tbody id="dlp-mes"></tbody></table></div>'
  + '<div class="dlp-paginas" id="dlp-mes-nav"></div>'
  + '</div>'
  + '<div class="dlp-painel" data-painel="geral" hidden>'
  + '<div class="dlp-destaque"><h3 id="dlp-titulo-geral"><span>Top de sempre</span>Classificação Geral</h3></div>'
  + '<p class="dlp-dica">Carrega num nome para veres o percurso dessa pessoa na geral.</p>'
  + '<div class="dlp-scroll"><table class="dlp-tabela">'
  + '<thead><tr><th></th><th>Patrono</th><th>Certos</th><th>Pontos</th></tr></thead>'
  + '<tbody id="dlp-geral"></tbody></table></div>'
  + '<div class="dlp-paginas" id="dlp-geral-nav"></div>'
  + '</div>'
  + '<p class="dlp-rodape" id="dlp-rodape"></p>'
  + '<p class="dlp-carregar" id="dlp-carregar">A carregar a classificação…</p>';

var D = null;                                  // os dados, quando chegarem
var i = 0;                                     // jornada aberta (indice em D.semanas)
var mexeu = false;                             // o visitante ja mudou de jornada?
var aberto = null;                             // patrono expandido em "Esta jornada"
var abertoGeral = null;                        // patrono com o percurso aberto na geral

/* As tabelas de patronos ficam compridas depressa. Mostram-se 10 de cada vez,
   com setas por baixo para andar para tras e para a frente. Cada tabela tem
   a sua pagina; voltam todas ao inicio quando se muda de jornada. */
var POR_PAGINA = 10;
var pagina = { semana: 0, mes: 0, geral: 0 };

/* ---------- procura por nome ----------
   Sem acentos nem maiusculas: "joao" encontra "João". Varias palavras
   procuram-se todas, por qualquer ordem: "viana tiago" encontra "Tiago Viana".
   Fica guardada neste browser — quem volta ve-se logo. */

function semAcentos(t) {
  var s = String(t == null ? '' : t).toLowerCase();
  return s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g, '') : s;
}

var termo = '';
var palavras = [];
function definirTermo(texto) {
  termo = String(texto || '');
  palavras = semAcentos(termo).split(/\s+/).filter(Boolean);
  try {
    if (termo.trim()) localStorage.setItem('dlp-procura', termo); else localStorage.removeItem('dlp-procura');
  } catch (e) { /* browser sem armazenamento: nao faz mal */ }
}
try { definirTermo(localStorage.getItem('dlp-procura') || ''); } catch (e) { definirTermo(''); }

function corresponde(nome) {
  if (!palavras.length) return true;
  var n = semAcentos(nome);
  for (var k = 0; k < palavras.length; k++) if (n.indexOf(palavras[k]) < 0) return false;
  return true;
}

/** O nome com as partes procuradas sublinhadas. */
function destacar(nome) {
  var orig = String(nome == null ? '' : nome);
  if (!palavras.length) return esc(orig);
  // o nome sem acentos pode ter outro comprimento: guarda-se de onde veio cada letra
  var norm = '', mapa = [];
  for (var k = 0; k < orig.length; k++) {
    var c = semAcentos(orig.charAt(k));
    for (var m = 0; m < c.length; m++) { norm += c.charAt(m); mapa.push(k); }
  }
  var marcas = [];
  palavras.forEach(function (p) {
    var pos = norm.indexOf(p);
    if (pos >= 0) marcas.push([mapa[pos], mapa[pos + p.length - 1] + 1]);
  });
  if (!marcas.length) return esc(orig);
  marcas.sort(function (a, b) { return a[0] - b[0]; });
  var juntas = [marcas[0]];
  marcas.slice(1).forEach(function (r) {
    var ult = juntas[juntas.length - 1];
    if (r[0] <= ult[1]) ult[1] = Math.max(ult[1], r[1]); else juntas.push(r);
  });
  var html = '', desde = 0;
  juntas.forEach(function (r) {
    html += esc(orig.slice(desde, r[0])) + '<mark>' + esc(orig.slice(r[0], r[1])) + '</mark>';
    desde = r[1];
  });
  return html + esc(orig.slice(desde));
}

/**
 * Em que jornada abrir: a que esta a decorrer ou, se nenhuma estiver, a
 * proxima a arrancar. E calculado sempre que a pagina abre, por isso
 * continua certo semanas depois.
 */
function jornadaParaAbrir() {
  var agora = Date.now();
  for (var k = 0; k < D.semanas.length; k++) {
    var s = D.semanas[k];
    var fim = s.ate ? Date.parse(s.ate) : NaN;
    /* Uma jornada esta acabada por duas vias, e basta uma:
       - ja tem resultado em todos os jogos (o caso normal);
       - ou passou a hora do ultimo jogo com folga, o que resolve os jogos
         adiados que nunca chegam a ter resultado. */
    var tudoJogado = s.jogos.length > 0 && s.jogosPontuados >= s.jogos.length;
    var passouAHora = !isNaN(fim) && agora > fim + 6 * 3600 * 1000;
    if (!tudoJogado && !passouAHora) return k;
  }
  return D.semanas.length - 1;                 // epoca acabada: a ultima
}

/* ---------- contas, feitas aqui e nao no ficheiro ----------
   O ficheiro publicado leva so palpites e resultados; a pontuacao,
   a ordenacao e a classificacao sao refeitas de cada vez que a pagina abre. */

/** Quem tem os mesmos pontos partilha o lugar (1, 1, 3, ...). */
function atribuirLugares(lista) {
  var pos = 0;
  var anterior = null;
  return lista.map(function (p, k) {
    if (p.pontos !== anterior) pos = k + 1;
    anterior = p.pontos;
    p.lugar = pos;
    return p;
  });
}

/* A chave e o "ref", que vem do id do Patreon: ha patronos com o mesmo
   primeiro nome e ha quem mude de nome a meio da epoca. Pelo nome, uns
   somavam-se uns aos outros e outros partiam-se em dois. */
function chaveDe(p) {
  return p.ref || 'nome:' + String(p.nome || '').trim().toLowerCase();
}

function pontuar(s) {
  // o jogo da semana vale mais, por isso soma-se jogo a jogo
  var especial = D.pontosJogoDaSemana || (D.pontosPorAcerto * 2);
  var lista = s.lista.map(function (p) {
    var acertos = 0, possiveis = 0, ganhos = 0;
    var detalhe = s.jogos.map(function (j, k) {
      var pick = p.picks[k] || '';
      if (!pick || !j.certo) return null;      // sem palpite ou jogo sem resultado
      possiveis++;
      var certo = pick === j.certo;
      if (certo) { acertos++; ganhos += j.semana ? especial : D.pontosPorAcerto; }
      return certo;
    });
    return { ref: p.ref || '', nome: p.nome, picks: p.picks, detalhe: detalhe,
             acertos: acertos, possiveis: possiveis, pontos: ganhos };
  });
  lista.sort(function (a, b) {
    return b.pontos - a.pontos || a.nome.localeCompare(b.nome, 'pt');
  });
  return atribuirLugares(lista);
}

/** Soma os pontos de um conjunto de jornadas e ordena, com lugares. */
function somar(quais) {
  var por = {};
  quais.forEach(function (s) {
    pontuar(s).forEach(function (p) {
      var chave = chaveDe(p);
      if (!por[chave]) por[chave] = { chave: chave, nome: p.nome, pontos: 0, acertos: 0 };
      por[chave].nome = p.nome;              // fica a grafia mais recente
      por[chave].pontos += p.pontos;
      por[chave].acertos += p.acertos;
    });
  });
  var lista = Object.keys(por).map(function (k) { return por[k]; });
  lista.sort(function (a, b) {
    return b.pontos - a.pontos || b.acertos - a.acertos || a.nome.localeCompare(b.nome, 'pt');
  });
  return atribuirLugares(lista);
}

function geralAte(numero) {
  return somar(D.semanas.filter(function (s) { return s.n <= numero; }));
}

function doMes(mes) {
  if (!mes) return [];
  return somar(D.semanas.filter(function (s) { return s.mes === mes; }));
}

function lugar(n) {
  return '<span class="dlp-lugar' + (n <= 3 ? ' dlp-lugar-' + n : '') + '">' + n + '</span>';
}

/* ---------- jogos, com o que os patronos escolheram ---------- */

/**
 * Quantos patronos escolheram 1, X e 2 em cada jogo, em percentagem.
 * Arredonda pelo maior resto, para as tres somarem sempre 100.
 */
function escolhas(s) {
  return s.jogos.map(function (j, k) {
    var c = { '1': 0, 'X': 0, '2': 0 }, total = 0;
    s.lista.forEach(function (p) {
      var v = p.picks[k];
      if (c[v] !== undefined) { c[v]++; total++; }
    });
    if (!total) return null;
    var pc = {}, soma = 0, restos = [];
    ['1', 'X', '2'].forEach(function (v) {
      var x = c[v] * 100 / total;
      pc[v] = Math.floor(x);
      soma += pc[v];
      restos.push({ v: v, r: x - pc[v] });
    });
    restos.sort(function (a, b) { return b.r - a.r; });
    for (var m = 0; m < 100 - soma; m++) pc[restos[m].v]++;
    var maior = Math.max(c['1'], c['X'], c['2']);
    return { conta: c, pc: pc, total: total, maior: maior };
  });
}

function desenhaJogos(s) {
  var e = escolhas(s);
  var algum = 0;
  document.getElementById('dlp-jogos').innerHTML = s.jogos.map(function (j, k) {
    var esc_ = e[k];
    if (esc_) algum = Math.max(algum, esc_.total);
    var opcao = function (v) {
      var caixa = '<span class="dlp-p' + (j.certo === v ? ' dlp-p-ok' : '') + '">' + v + '</span>';
      if (!esc_) return caixa;
      var mais = esc_.conta[v] === esc_.maior && esc_.maior > 0;
      return '<span class="dlp-op" title="' + esc_.conta[v] + ' de ' + esc_.total + ' patronos">'
        + caixa + '<span class="dlp-pc' + (mais ? ' dlp-pc-mais' : '') + '">' + esc_.pc[v] + '%</span></span>';
    };
    return '<tr' + (j.semana ? ' class="dlp-jogo-semana"' : '') + '>'
      + '<td class="dlp-n">' + (k + 1) + '</td>'
      + '<td class="dlp-j">' + esc(j.casa) + ' <i>vs</i> ' + esc(j.fora)
      + (j.semana ? '<span class="dlp-etiq-semana">Jogo da semana · '
          + (D.pontosJogoDaSemana || D.pontosPorAcerto * 2) + ' pontos</span>' : '')
      + '</td>'
      + '<td class="dlp-r">' + (j.certo ? esc(j.resultado) : '<em>' + esc(j.resultado || 'por jogar') + '</em>') + '</td>'
      + '<td class="dlp-picks">' + opcao('1') + opcao('X') + opcao('2') + '</td></tr>';
  }).join('') || '<tr><td class="dlp-vazio">Sem jogos nesta jornada.</td></tr>';

  var nota = document.getElementById('dlp-nota-pc');
  nota.hidden = !algum;
  nota.textContent = algum
    ? 'Por baixo de cada jogo: o que os ' + s.lista.length + ' patronos desta jornada escolheram.'
      + ' A laranja, o resultado certo.'
    : '';
}

function detalhe(s, p) {
  var itens = s.jogos.map(function (j, k) {
    var pick = p.picks[k] || '';
    var estado = p.detalhe[k];
    var classe = estado === true ? ' dlp-certo' : (estado === false ? ' dlp-errado' : '');
    return '<li><span class="dlp-dn">' + (k + 1) + '</span>'
      + '<span class="dlp-dj">' + esc(j.casa) + ' <i>vs</i> ' + esc(j.fora) + '</span>'
      + '<span class="dlp-dp' + classe + '">' + esc(pick || '—') + '</span></li>';
  }).join('');
  return '<tr class="dlp-det"><td colspan="4"><ul class="dlp-detalhe">' + itens + '</ul></td></tr>';
}

/**
 * Corta a lista em paginas de 10 e desenha as setas por baixo da tabela.
 * O lugar de cada patrono ja vem calculado sobre a lista toda, por isso a
 * pagina 2 comeca mesmo no 11.o e nao volta ao 1.o.
 *
 * Com uma procura escrita nao ha paginas: aparecem todos os que batem certo,
 * cada um no seu lugar verdadeiro.
 */
function fatia(lista, chave) {
  var nav = document.getElementById('dlp-' + chave + '-nav');

  if (palavras.length) {
    var achados = lista.filter(function (p) { return corresponde(p.nome); });
    nav.innerHTML = achados.length
      ? '<span class="dlp-encontrados">' + achados.length
        + (achados.length === 1 ? ' encontrado' : ' encontrados') + ' em ' + lista.length + '</span>'
      : '';
    return achados;
  }

  var total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  if (pagina[chave] > total - 1) pagina[chave] = total - 1;
  if (pagina[chave] < 0) pagina[chave] = 0;
  var de = pagina[chave] * POR_PAGINA;

  nav.innerHTML = lista.length <= POR_PAGINA ? '' : (
      '<button type="button" class="dlp-pag" data-tabela="' + chave + '" data-passo="-1"'
    + (pagina[chave] === 0 ? ' disabled' : '') + ' aria-label="Anteriores">&#8249;</button>'
    + '<span>' + (de + 1) + '&#8211;' + Math.min(de + POR_PAGINA, lista.length)
    + ' de ' + lista.length + '</span>'
    + '<button type="button" class="dlp-pag" data-tabela="' + chave + '" data-passo="1"'
    + (pagina[chave] === total - 1 ? ' disabled' : '') + ' aria-label="Seguintes">&#8250;</button>'
  );

  return lista.slice(de, de + POR_PAGINA);
}

/** A procura nao achou ninguem nesta tabela. */
function semNinguem(onde) {
  return '<tr><td class="dlp-vazio" colspan="4">Ninguém com “' + esc(termo.trim()) + '” '
    + onde + '.</td></tr>';
}

function desenhaSemana(s) {
  var lista = pontuar(s);
  var corpo = document.getElementById('dlp-semana');
  if (!lista.length) {
    document.getElementById('dlp-semana-nav').innerHTML = '';
    corpo.innerHTML = '<tr><td class="dlp-vazio" colspan="4">Ainda não há palpites nesta jornada.</td></tr>';
    return;
  }
  corpo.innerHTML = fatia(lista, 'semana').map(function (p) {
    var estaAberto = aberto === p.nome;
    var linha = '<tr class="dlp-clicavel' + (estaAberto ? ' dlp-ativo' : '') + '" data-nome="' + esc(p.nome) + '">'
      + '<td class="dlp-pos">' + lugar(p.lugar) + '</td>'
      + '<td class="dlp-nome"><button type="button" class="dlp-abrir" aria-expanded="' + estaAberto + '">'
      + '<span>' + destacar(p.nome) + '</span><span class="dlp-chevron">' + (estaAberto ? '▴' : '▾') + '</span></button></td>'
      + '<td class="dlp-num">' + p.acertos + '<span class="dlp-de">/' + p.possiveis + '</span></td>'
      + '<td class="dlp-num dlp-forte">' + p.pontos + '</td></tr>';
    return linha + (estaAberto ? detalhe(s, p) : '');
  }).join('') || semNinguem('nesta jornada');
}

/* quantos lugares desta tabela levam premio; 0 = nenhum */
function linhasDeClassificacao(lista, chave, vazio, premiados, s) {
  var quantos = premiados || 0;
  if (!lista.length) {
    document.getElementById('dlp-' + chave + '-nav').innerHTML = '';
    return '<tr><td class="dlp-vazio" colspan="4">' + vazio + '</td></tr>';
  }
  var clicavel = chave === 'geral';
  return fatia(lista, chave).map(function (p) {
    /* p.pontos > 0: enquanto ninguem pontuar, estao todos empatados em
       primeiro e o trofeu aparecia ao lado de toda a gente. */
    var premiada = quantos > 0 && p.lugar <= quantos && p.pontos > 0;
    var estaAberto = clicavel && abertoGeral === p.chave;
    var classes = [];
    if (premiada) classes.push('dlp-premiada');
    if (clicavel) classes.push('dlp-clicavel');
    if (estaAberto) classes.push('dlp-ativo');
    var trofeu = premiada ? '<span class="dlp-troco" title="Lugar premiado">🏆</span>' : '';
    var nome = clicavel
      ? '<button type="button" class="dlp-abrir dlp-abrir-geral" data-chave="' + esc(p.chave) + '" aria-expanded="'
        + estaAberto + '"><span>' + destacar(p.nome) + trofeu + '</span>'
        + '<span class="dlp-chevron">' + (estaAberto ? '▴' : '▾') + '</span></button>'
      : destacar(p.nome) + trofeu;
    var linha = '<tr' + (classes.length ? ' class="' + classes.join(' ') + '"' : '') + '>'
      + '<td class="dlp-pos">' + lugar(p.lugar) + '</td>'
      + '<td class="dlp-nome">' + nome + '</td>'
      + '<td class="dlp-num">' + p.acertos + '</td>'
      + '<td class="dlp-num dlp-forte">' + p.pontos + '</td></tr>';
    return linha + (estaAberto ? '<tr class="dlp-det"><td colspan="4">' + percursoHtml(p.chave, s) + '</td></tr>' : '');
  }).join('') || semNinguem(chave === 'mes' ? 'neste mês' : 'na classificação');
}

/* ---------- percurso de um patrono na geral ---------- */

/**
 * Lugar na geral depois de cada jornada (ate a que esta aberta) e o que fez
 * em cada uma. Jornadas sem nenhum resultado ainda nao contam: repetiam a
 * anterior e o grafico ficava com degraus que nao existiram.
 */
function percurso(chave, ateN) {
  var pontos = [];
  D.semanas.forEach(function (s) {
    if (s.n > ateN || !s.jogosPontuados) return;
    var geral = geralAte(s.n);
    var eu = null;
    for (var k = 0; k < geral.length; k++) if (geral[k].chave === chave) { eu = geral[k]; break; }
    var nesta = null;
    pontuar(s).forEach(function (p) { if (chaveDe(p) === chave) nesta = p; });
    pontos.push({
      n: s.n, lugar: eu ? eu.lugar : null, de: geral.length,
      pontos: nesta ? nesta.pontos : null,
      acertos: nesta ? nesta.acertos : 0, possiveis: nesta ? nesta.possiveis : 0,
    });
  });
  return pontos;
}

function grafico(pts, largura) {
  var comLugar = pts.filter(function (p) { return p.lugar; });
  // margens: a esquerda leva a escala (1.º e o pior lugar), a de cima as etiquetas
  var A = 156, mE = 36, mD = 14, mC = 22, mB = 24;
  var W = Math.max(240, largura);
  var pior = Math.max(3, Math.max.apply(null, comLugar.map(function (p) { return p.lugar; })));
  var passo = comLugar.length > 1 ? (W - mE - mD) / (comLugar.length - 1) : 0;
  var x = function (k) { return comLugar.length > 1 ? mE + k * passo : W / 2; };
  var y = function (l) { return mC + (l - 1) / (pior - 1) * (A - mC - mB); };

  // com muitas jornadas nao cabem todas as etiquetas: mostram-se algumas
  var cada = Math.max(1, Math.ceil(28 / Math.max(passo, 1)));
  var melhor = Math.min.apply(null, comLugar.map(function (p) { return p.lugar; }));
  var svg = '<svg width="' + W + '" height="' + A + '" viewBox="0 0 ' + W + ' ' + A + '" role="img"'
    + ' aria-label="Lugar na classificação geral ao longo das jornadas">';
  // linha do 1.o lugar, para dar a medida
  svg += '<line class="dlp-g-grelha" x1="' + mE + '" x2="' + (W - mD) + '" y1="' + y(1) + '" y2="' + y(1) + '"/>'
    + '<text class="dlp-g-eixo" text-anchor="end" x="' + (mE - 12) + '" y="' + (y(1) + 4) + '">1.º</text>';
  if (pior > 1) {
    svg += '<line class="dlp-g-grelha" x1="' + mE + '" x2="' + (W - mD) + '" y1="' + y(pior) + '" y2="' + y(pior) + '"/>'
      + '<text class="dlp-g-eixo" text-anchor="end" x="' + (mE - 12) + '" y="' + (y(pior) + 4) + '">' + pior + '.º</text>';
  }
  if (comLugar.length > 1) {
    svg += '<polyline class="dlp-g-linha" points="' + comLugar.map(function (p, k) {
      return x(k).toFixed(1) + ',' + y(p.lugar).toFixed(1);
    }).join(' ') + '"/>';
  }
  comLugar.forEach(function (p, k) {
    var ultimo = k === comLugar.length - 1;
    var mostrar = ultimo || k === 0 || p.lugar === melhor || k % cada === 0;
    svg += '<circle class="dlp-g-ponto' + (ultimo ? ' dlp-g-ponto-fim' : '') + '" cx="' + x(k).toFixed(1)
      + '" cy="' + y(p.lugar).toFixed(1) + '" r="' + (ultimo ? 5 : 4) + '"/>';
    if (mostrar) {
      svg += '<text class="dlp-g-txt" text-anchor="middle" x="' + x(k).toFixed(1) + '" y="'
        + (y(p.lugar) - 10).toFixed(1) + '">' + p.lugar + '.º</text>';
    }
    if (k % cada === 0 || ultimo) {
      svg += '<text class="dlp-g-eixo" text-anchor="middle" x="' + x(k).toFixed(1) + '" y="' + (A - 4) + '">J' + p.n + '</text>';
    }
  });
  return svg + '</svg>';
}

function percursoHtml(chave, s) {
  var pts = percurso(chave, s.n);
  var comLugar = pts.filter(function (p) { return p.lugar; });
  if (!comLugar.length) {
    return '<div class="dlp-hist"><p class="dlp-hist-so">Ainda sem jornadas com resultados.</p></div>';
  }

  var agora = comLugar[comLugar.length - 1];
  var antes = comLugar.length > 1 ? comLugar[comLugar.length - 2] : null;
  var mexida = '';
  if (antes) {
    var d = antes.lugar - agora.lugar;
    mexida = d > 0 ? ' <em class="dlp-sobe">▲' + d + '</em>'
      : (d < 0 ? ' <em class="dlp-desce">▼' + (-d) + '</em>' : ' <em>=</em>');
  }
  var melhorLugar = comLugar.reduce(function (a, b) { return b.lugar < a.lugar ? b : a; });
  var jogadas = pts.filter(function (p) { return p.pontos !== null; });
  var melhorJornada = jogadas.length
    ? jogadas.reduce(function (a, b) { return b.pontos > a.pontos ? b : a; }) : null;
  var acertos = 0, possiveis = 0;
  jogadas.forEach(function (p) { acertos += p.acertos; possiveis += p.possiveis; });

  // a largura da tabela menos as margens da celula e da caixa
  var tabela = raiz.querySelector('[data-painel="geral"] .dlp-scroll');
  var largura = ((tabela && tabela.clientWidth) || raiz.clientWidth || 600) - 46;
  var html = '<div class="dlp-hist"><h4>Lugar na geral, jornada a jornada</h4>';
  html += comLugar.length > 1
    ? grafico(pts, largura)
    : '<p class="dlp-hist-so">Só tem uma jornada — o gráfico aparece a partir da segunda.</p>';
  html += '<div class="dlp-hist-numeros">'
    + '<div><span>Agora</span><b>' + agora.lugar + '.º' + mexida + '</b><em>de ' + agora.de + '</em></div>'
    + '<div><span>Melhor lugar</span><b>' + melhorLugar.lugar + '.º</b><em>na J' + melhorLugar.n + '</em></div>'
    + '<div><span>Melhor jornada</span><b>' + (melhorJornada ? melhorJornada.pontos + ' pts' : '—') + '</b>'
    + (melhorJornada ? '<em>na J' + melhorJornada.n + '</em>' : '') + '</div>'
    + '<div><span>Acertos</span><b>' + acertos + ' de ' + possiveis + '</b>'
    + (possiveis ? '<em>' + Math.round(acertos * 100 / possiveis) + '% · ' + jogadas.length
      + (jogadas.length === 1 ? ' jornada' : ' jornadas') + '</em>' : '') + '</div>'
    + '</div></div>';
  return html;
}

/* ---------- premios ---------- */

var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
             'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/* "2026-09" -> "Setembro de 2026". Calculado aqui e nao tirado das jornadas
   porque uma jornada sem horarios marcados ainda nao sabe a que mes pertence. */
function nomeDeMes(codigo) {
  var p = String(codigo || '').split('-');
  var nome = MESES[Number(p[1]) - 1];
  return nome ? nome + ' de ' + p[0] : '';
}

/** Premios de um lugar, em linha e separados por ponto. */
function emLinha(lista) {
  return (lista || []).map(esc).join('<i>·</i>');
}

function desenhaPremios() {
  var pr = D.premios || {};
  var lugares = pr.geral || [];
  var vencedores = pr.vencedores || [];
  var caixa = document.getElementById('dlp-premios');

  if (!lugares.length && !(pr.premioDoMes || []).length && !vencedores.length) {
    caixa.hidden = true;
    return;
  }
  caixa.hidden = false;

  var html = '';

  // o mais recente primeiro, que e o que interessa mostrar
  if (vencedores.length) {
    var v = vencedores[0];
    html += '<div class="dlp-vencedor">'
      + '<span class="dlp-vencedor-tacea">🏆</span>'
      + '<span class="dlp-vencedor-txt">'
      // so o mes, sem o ano: a epoca e a que esta a decorrer
      + '<span>Vencedor de ' + esc((nomeDeMes(v.mes) || 'mês').split(' de ')[0]) + '</span>'
      + '<b>' + esc(v.nome) + '</b>'
      + (v.premio ? '<em>Ganha: ' + esc(v.premio) + '</em>' : '')
      + '</span></div>';
  }

  if (!lugares.length && !(pr.premioDoMes || []).length) {
    caixa.innerHTML = html;
    return;
  }

  html += '<div class="dlp-quadro">'
    + '<div class="dlp-quadro-topo"><h3>Prémios</h3>'
    + '<span>no fim da época, para a classificação geral</span></div>';

  if (lugares.length) {
    html += '<ul class="dlp-lugares">' + lugares.map(function (lista, k) {
      var n = k + 1;
      // o mesmo circulo que aparece nas tabelas, para se ligar de imediato
      return '<li class="dlp-lug">'
        + '<span class="dlp-lugar' + (n <= 3 ? ' dlp-lugar-' + n : '') + '">' + n + '</span>'
        + '<span class="dlp-lug-txt">' + emLinha(lista) + '</span></li>';
    }).join('') + '</ul>';
  }

  if (pr.mes && (pr.premioDoMes || []).length) {
    html += '<div class="dlp-mes-box">'
      + '<b>' + esc(nomeDeMes(pr.mes) || 'Prémio do mês') + ' · 1.º do mês</b>'
      + '<span>' + emLinha(pr.premioDoMes) + '</span></div>';
  }

  if (pr.nota) html += '<p class="dlp-nota">' + esc(pr.nota) + '</p>';

  caixa.innerHTML = html + '</div>';
}

function desenhaMes(s) {
  var titulo = document.getElementById('dlp-titulo-mes');
  var corpo = document.getElementById('dlp-mes');
  var botao = raiz.querySelector('.dlp-aba[data-aba="mes"]');

  if (!s.mes) {                            // jornada sem datas: não dá para agrupar
    botao.hidden = true;
    if (aba === 'mes') aba = 'semana';     // estavamos nela: sai-se para outra
    return;
  }
  botao.hidden = false;
  // a aba diz o mes: "Setembro" em vez de um "Mês" que nao diz nada
  botao.textContent = (s.nomeDoMes || 'Mês').split(' de ')[0];

  var quantas = D.semanas.filter(function (x) { return x.mes === s.mes; }).length;
  titulo.textContent = 'Melhores de ' + s.nomeDoMes
    + ' (' + quantas + (quantas === 1 ? ' jornada)' : ' jornadas)');
  /* Marca o 1.o lugar quando o mes tem premio a decorrer ou quando ja foi
     ganho — senao a tabela de setembro perdia o trofeu assim que o premio
     de outubro fosse desligado. */
  var pr = D.premios || {};
  var jaGanho = (pr.vencedores || []).some(function (v) { return v.mes === s.mes; });
  var comPremio = (pr.mes === s.mes || jaGanho) ? 1 : 0;
  corpo.innerHTML = linhasDeClassificacao(
    doMes(s.mes), 'mes', 'Ainda sem pontos neste mês.', comPremio, s);
}

function desenhaGeral(s) {
  // um lugar premiado por cada bloco de premios configurado
  var quantos = ((D.premios || {}).geral || []).length;
  document.getElementById('dlp-geral').innerHTML = linhasDeClassificacao(
    geralAte(s.n), 'geral', 'Sem classificação ainda.', quantos, s);
}

/**
 * Tres curiosidades da jornada, tiradas so dos palpites:
 * a equipa que mais gente pos a ganhar, a que mais gente pos a perder,
 * e o jogo onde mais gente apostou no empate.
 */
function curiosidades(s) {
  var ganhar = {}, perder = {}, empate = {};
  var conta = function (onde, chave) { onde[chave] = (onde[chave] || 0) + 1; };

  s.lista.forEach(function (p) {
    s.jogos.forEach(function (j, k) {
      var pick = p.picks[k];
      if (pick === '1') { conta(ganhar, j.casa); conta(perder, j.fora); }
      else if (pick === '2') { conta(ganhar, j.fora); conta(perder, j.casa); }
      else if (pick === 'X') { conta(empate, j.casa + ' – ' + j.fora); }
    });
  });

  // empates a contar desempatam por ordem alfabetica, para nao andar aos saltos
  var maior = function (onde) {
    var melhor = null;
    Object.keys(onde).sort().forEach(function (nome) {
      if (!melhor || onde[nome] > melhor.n) melhor = { nome: nome, n: onde[nome] };
    });
    return melhor;
  };

  return { ganhar: maior(ganhar), perder: maior(perder), empate: maior(empate) };
}

function desenhaCuriosidades(s) {
  var caixa = document.getElementById('dlp-curiosidades');
  var c = curiosidades(s);
  var cartoes = [
    { rot: 'Mais apostada a ganhar', d: c.ganhar },
    { rot: 'Mais apostada a perder', d: c.perder },
    { rot: 'Empate mais apostado', d: c.empate },
  ].filter(function (x) { return x.d; });

  caixa.hidden = !cartoes.length;
  caixa.innerHTML = cartoes.map(function (x) {
    return '<div class="dlp-curio"><span>' + x.rot + '</span>'
      + '<b>' + esc(x.d.nome) + '<br><em>' + x.d.n
      + (x.d.n === 1 ? ' palpite' : ' palpites') + '</em></b></div>';
  }).join('');
}

/* ---------- abas ---------- */

var aba = 'jogos';

function mostrarAba(nome) {
  aba = nome;
  raiz.querySelectorAll('.dlp-aba').forEach(function (b) {
    b.setAttribute('aria-selected', String(b.getAttribute('data-aba') === nome));
  });
  raiz.querySelectorAll('.dlp-painel').forEach(function (p) {
    p.hidden = p.getAttribute('data-painel') !== nome;
  });
  // a procura so faz sentido nas tabelas de patronos
  document.getElementById('dlp-procura').hidden = nome === 'jogos';
}

function desenhaTabelas() {
  var s = D.semanas[i];
  desenhaSemana(s);
  desenhaMes(s);
  desenhaGeral(s);
}

function desenha() {
  var s = D.semanas[i];
  document.getElementById('dlp-carregar').hidden = true;
  document.getElementById('dlp-jornada').textContent = 'Jornada ' + s.n;
  raiz.querySelector('.dlp-seta[data-passo="-1"]').disabled = i === 0;
  raiz.querySelector('.dlp-seta[data-passo="1"]').disabled = i === D.semanas.length - 1;
  desenhaPremios();
  desenhaCuriosidades(s);
  desenhaJogos(s);
  desenhaTabelas();
  mostrarAba(aba);

  var rodape = 'Cada palpite certo vale ' + D.pontosPorAcerto + ' pontos, e o <b>jogo da semana</b> vale '
    + (D.pontosJogoDaSemana || D.pontosPorAcerto * 2) + '. Jogos adiados ou por realizar não contam.';
  var d = D.atualizado ? new Date(D.atualizado) : null;
  if (d && !isNaN(d)) {
    rodape += ' · Atualizado a ' + d.toLocaleDateString('pt-PT') + ' às '
      + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  }
  document.getElementById('dlp-rodape').innerHTML = rodape;
}

/* ---------- dados ----------
   Vem do dados.json publicado. Guarda-se uma copia neste browser: abre logo
   com ela enquanto chega a fresca, e se o GitHub falhar fica a ultima boa. */

function valido(d) {
  return d && Array.isArray(d.semanas) && d.semanas.length;
}

function usar(novo) {
  var jornadaAberta = D && D.semanas[i] && D.semanas[i].n;
  D = novo;
  if (mexeu && jornadaAberta) {
    // o visitante escolheu uma jornada: nao lha tiramos debaixo dos pes
    var k = D.semanas.map(function (s) { return s.n; }).indexOf(jornadaAberta);
    i = k >= 0 ? k : D.semanas.length - 1;
  } else {
    i = jornadaParaAbrir();
  }
  desenha();
}

/**
 * Dois caminhos para o mesmo ficheiro. A API do GitHub guarda-o em cache
 * 1 minuto; o endereco normal guarda 5. Tenta-se primeiro o rapido e,
 * se falhar (limite de pedidos, avaria), usa-se o outro.
 */
function caminhos() {
  var lista = [];
  var fonte = CONFIG.fonte || '';
  // .../raw.githubusercontent.com/UTILIZADOR/REPOSITORIO/RAMO/ficheiro
  var p = fonte.split('/');
  if (p[2] === 'raw.githubusercontent.com' && p.length >= 7) {
    lista.push({
      url: 'https://api.github.com/repos/' + p[3] + '/' + p[4]
         + '/contents/' + p.slice(6).join('/') + '?ref=' + p[5],
      opcoes: { cache: 'no-store', headers: { Accept: 'application/vnd.github.raw' } },
    });
  }
  if (fonte) {
    lista.push({
      url: fonte + (fonte.indexOf('?') < 0 ? '?' : '&') + 't=' + Math.floor(Date.now() / 60000),
      opcoes: { cache: 'no-store' },
    });
  }
  return lista;
}

function tentar(lista, k) {
  if (k >= lista.length) return Promise.reject(new Error('sem fonte'));
  return fetch(lista[k].url, lista[k].opcoes)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .catch(function () { return tentar(lista, k + 1); });
}

function carregar() {
  var copia = null;
  try { copia = JSON.parse(localStorage.getItem('dlp-dados') || 'null'); } catch (e) { copia = null; }
  if (valido(copia)) usar(copia);

  tentar(caminhos(), 0)
    .then(function (novo) {
      if (!valido(novo)) throw new Error('ficheiro vazio');
      try { localStorage.setItem('dlp-dados', JSON.stringify(novo)); } catch (e) { /* cheio: paciencia */ }
      usar(novo);
    })
    .catch(function () {
      if (D) return;                         // fica a copia que ja esta a vista
      document.getElementById('dlp-carregar').textContent =
        'Não consegui carregar a classificação. Tenta outra vez daqui a um bocadinho.';
    });
}

/* ---------- cliques e procura ---------- */

raiz.addEventListener('click', function (e) {
  if (!D) return;
  var alvo = e.target;

  var seta = alvo.closest('.dlp-seta');
  if (seta) {
    var novo = i + Number(seta.getAttribute('data-passo'));
    if (novo >= 0 && novo < D.semanas.length) {
      i = novo; aberto = null; abertoGeral = null; mexeu = true;
      pagina.semana = pagina.mes = pagina.geral = 0;   // jornada nova, tabelas do inicio
      desenha();
    }
    return;
  }

  var botaoAba = alvo.closest('.dlp-aba');
  if (botaoAba) { mostrarAba(botaoAba.getAttribute('data-aba')); return; }

  var pag = alvo.closest('.dlp-pag');
  if (pag) {
    var qual = pag.getAttribute('data-tabela');
    pagina[qual] += Number(pag.getAttribute('data-passo'));
    if (qual === 'semana') { aberto = null; desenhaSemana(D.semanas[i]); }
    else if (qual === 'mes') desenhaMes(D.semanas[i]);
    else { abertoGeral = null; desenhaGeral(D.semanas[i]); }
    return;
  }

  var limpar = alvo.closest('.dlp-limpar');
  if (limpar) {
    var campo = document.getElementById('dlp-procurar');
    campo.value = '';
    procurar('');
    campo.focus();
    return;
  }

  var daGeral = alvo.closest('.dlp-abrir-geral');
  if (daGeral) {
    var chave = daGeral.getAttribute('data-chave');
    abertoGeral = abertoGeral === chave ? null : chave;
    desenhaGeral(D.semanas[i]);
    return;
  }

  var botao = alvo.closest('.dlp-abrir');
  if (botao) {
    var nome = botao.closest('tr').getAttribute('data-nome');
    aberto = aberto === nome ? null : nome;
    desenhaSemana(D.semanas[i]);
  }
});

function procurar(texto) {
  definirTermo(texto);
  document.getElementById('dlp-limpar').hidden = !termo;
  // procurar outra coisa volta a paginacao ao inicio
  pagina.semana = pagina.mes = pagina.geral = 0;
  if (D) desenhaTabelas();
}

var campoProcura = document.getElementById('dlp-procurar');
campoProcura.value = termo;
document.getElementById('dlp-limpar').hidden = !termo;
campoProcura.addEventListener('input', function () { procurar(campoProcura.value); });
campoProcura.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { campoProcura.value = ''; procurar(''); }
});

// o grafico do percurso desenha-se a medida da largura: refaz-se ao rodar o telemovel
var esperaLargura = null;
window.addEventListener('resize', function () {
  if (!D || !abertoGeral) return;
  clearTimeout(esperaLargura);
  esperaLargura = setTimeout(function () { desenhaGeral(D.semanas[i]); }, 200);
});

carregar();

})({"titulo":"Liga dos Sócios DeLetra","competicao":"Liga Portugal Betclic","fonte":"https://raw.githubusercontent.com/staysafept/deletra-prognosticos/main/dados.json"}, ".dlp{--dlp-laranja:#ff4b03;--dlp-preto:#0B0B0B;--dlp-linha:#E4E4E4;--dlp-suave:#6E7178;\n--dlp-verde:#12B76A;--dlp-vermelho:#E01B3C;\nfont-family:'Poppins','Montserrat',-apple-system,'Segoe UI',sans-serif;\ncolor:var(--dlp-preto);max-width:760px;margin:0 auto;padding:8px 0;line-height:1.5}\n.dlp *{box-sizing:border-box}\n.dlp-carregar{text-align:center;color:var(--dlp-suave);font-size:14px;padding:40px 0}\n.dlp-topo{text-align:center;margin-bottom:18px}\n.dlp-topo h2{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:0 0 4px}\n.dlp-sub{color:var(--dlp-suave);font-size:14px;margin:0}\n.dlp-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:26px}\n.dlp-seta{width:34px;height:34px;border-radius:50%;border:1px solid var(--dlp-linha);\nbackground:#fff;color:var(--dlp-preto);font-size:19px;line-height:1;cursor:pointer;\ndisplay:flex;align-items:center;justify-content:center;padding:0 0 2px}\n.dlp-seta:hover:not(:disabled){background:var(--dlp-laranja);border-color:var(--dlp-laranja)}\n.dlp-seta:disabled{opacity:.3;cursor:default}\n.dlp-etiqueta{display:inline-block;background:var(--dlp-laranja);color:var(--dlp-preto);\nfont-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:5px 14px}\n.dlp-titulo{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;\ncolor:var(--dlp-suave);margin:32px 0 12px;padding-bottom:8px;border-bottom:2px solid var(--dlp-preto)}\n.dlp-dica{font-size:13px;color:var(--dlp-suave);margin:-4px 0 12px}\n.dlp-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}\n.dlp-tabela{width:100%;border-collapse:collapse;font-size:15px}\n.dlp-tabela th{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;\ncolor:var(--dlp-suave);text-align:left;padding:0 8px 8px}\n.dlp-tabela td{padding:11px 8px;border-bottom:1px solid var(--dlp-linha);vertical-align:middle}\n.dlp-tabela tbody tr:last-child td{border-bottom:0}\n.dlp-pos{width:44px}\n.dlp-lugar{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;\npadding:0 6px;border-radius:13px;background:#F1F1F1;color:var(--dlp-suave);\nfont-size:13px;font-weight:700;font-variant-numeric:tabular-nums}\n.dlp-lugar-1{background:var(--dlp-laranja);color:var(--dlp-preto)}\n.dlp-lugar-2{background:var(--dlp-preto);color:#fff}\n.dlp-lugar-3{background:#D9D9D9;color:var(--dlp-preto)}\n.dlp-nome{font-weight:600}\n.dlp-num{width:64px;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}\n.dlp-forte{font-weight:800;font-size:17px}\n.dlp-de{color:var(--dlp-suave);font-weight:400;font-size:13px}\n.dlp-n{width:28px;color:var(--dlp-suave);font-size:13px}\n.dlp-j{font-weight:600}\n.dlp-j i{font-style:normal;color:var(--dlp-suave);font-size:13px;padding:0 2px}\n.dlp-r{width:86px;white-space:nowrap;font-variant-numeric:tabular-nums}\n.dlp-r em{color:var(--dlp-suave);font-size:13px;font-style:normal}\n.dlp-picks{width:110px;white-space:nowrap;text-align:right}\n.dlp-p{display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;\nborder-radius:4px;background:#F1F1F1;color:#A8ABB1;font-size:13px;font-weight:700;margin-left:3px}\n.dlp-p-ok{background:var(--dlp-laranja);color:var(--dlp-preto)}\n.dlp-op{display:inline-flex;flex-direction:column;align-items:center;margin-left:3px;vertical-align:top}\n.dlp-op .dlp-p{margin-left:0}\n.dlp-pc{font-size:10.5px;line-height:1;margin-top:4px;color:#A8ABB1;font-weight:600;\nfont-variant-numeric:tabular-nums}\n.dlp-pc-mais{color:var(--dlp-preto);font-weight:800}\n.dlp-nota-pc{font-size:12px;color:var(--dlp-suave);margin:12px 0 0}\n.dlp-abrir{display:flex;align-items:center;gap:8px;width:100%;padding:0;border:0;\nbackground:none;font:inherit;font-weight:600;color:inherit;cursor:pointer;text-align:left}\n.dlp-chevron{color:var(--dlp-suave);font-size:11px}\n.dlp-clicavel:hover .dlp-abrir{color:#000}\n.dlp-clicavel:hover .dlp-chevron{color:var(--dlp-preto)}\n.dlp-ativo td{border-bottom:0}\n.dlp-det td{padding:0 8px 14px}\n.dlp-detalhe{list-style:none;margin:0;padding:10px 12px;background:#F7F7F7;border-radius:8px}\n.dlp-detalhe li{display:flex;align-items:center;gap:10px;padding:5px 0;font-size:14px}\n.dlp-dn{color:var(--dlp-suave);font-size:12px;width:16px;flex:none}\n.dlp-dj{flex:1;min-width:0}\n.dlp-dj i{font-style:normal;color:var(--dlp-suave);font-size:12px;padding:0 2px}\n.dlp-dp{flex:none;width:26px;height:26px;line-height:26px;text-align:center;border-radius:4px;\nbackground:#E7E7E7;color:var(--dlp-suave);font-size:13px;font-weight:700}\n.dlp-dp.dlp-certo{background:var(--dlp-verde);color:#fff}\n.dlp-dp.dlp-errado{background:var(--dlp-vermelho);color:#fff}\n.dlp-hist{background:#F7F7F7;border-radius:10px;padding:14px 14px 12px}\n.dlp-hist h4{margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.12em;\ntext-transform:uppercase;color:var(--dlp-suave)}\n.dlp-hist svg{display:block;overflow:visible}\n.dlp-hist .dlp-g-grelha{stroke:#E2E2E2;stroke-width:1;stroke-dasharray:3 4}\n.dlp-hist .dlp-g-linha{fill:none;stroke:var(--dlp-laranja);stroke-width:2.5;\nstroke-linejoin:round;stroke-linecap:round}\n.dlp-hist .dlp-g-ponto{fill:#fff;stroke:var(--dlp-laranja);stroke-width:2.5}\n.dlp-hist .dlp-g-ponto-fim{fill:var(--dlp-laranja)}\n.dlp-hist .dlp-g-txt{font-size:11px;font-weight:700;fill:var(--dlp-preto);\nfont-family:inherit;font-variant-numeric:tabular-nums}\n.dlp-hist .dlp-g-eixo{font-size:10.5px;fill:var(--dlp-suave);font-family:inherit}\n.dlp-hist-numeros{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}\n.dlp-hist-numeros div{background:#fff;border-radius:8px;padding:8px 10px;min-width:0}\n.dlp-hist-numeros span{display:block;font-size:10px;font-weight:700;letter-spacing:.08em;\ntext-transform:uppercase;color:var(--dlp-suave);margin-bottom:2px;line-height:1.3}\n.dlp-hist-numeros b{display:block;font-size:15px;font-weight:800;line-height:1.25;\nfont-variant-numeric:tabular-nums;overflow-wrap:break-word}\n.dlp-hist-numeros em{font-style:normal;font-size:11.5px;font-weight:600;color:var(--dlp-suave)}\n.dlp-sobe{color:var(--dlp-verde)!important}\n.dlp-desce{color:var(--dlp-vermelho)!important}\n.dlp-hist-so{font-size:13px;color:var(--dlp-suave);margin:4px 0 0}\n.dlp-procura{position:relative;margin:0 0 14px}\n.dlp-procura input{display:block;width:100%;height:42px;margin:0;padding:0 40px 0 38px;\nborder:1px solid var(--dlp-linha);border-radius:21px;background:#fff;color:var(--dlp-preto);\nfont:inherit;font-size:14px;outline:none;-webkit-appearance:none;appearance:none;box-shadow:none}\n.dlp-procura input:focus{border-color:var(--dlp-laranja)}\n.dlp-procura input::placeholder{color:#A8ABB1}\n.dlp-procura input::-webkit-search-cancel-button{display:none}\n.dlp-lupa{position:absolute;left:14px;top:50%;width:14px;height:14px;margin-top:-7px;\nborder:2px solid #A8ABB1;border-radius:50%;pointer-events:none}\n.dlp-lupa:after{content:'';position:absolute;width:2px;height:6px;background:#A8ABB1;\nright:-4px;bottom:-5px;transform:rotate(-45deg);border-radius:1px}\n.dlp-limpar{position:absolute;right:6px;top:50%;width:30px;height:30px;margin-top:-15px;\nborder:0;border-radius:50%;background:transparent;color:var(--dlp-suave);font-size:15px;\nline-height:1;cursor:pointer;padding:0}\n.dlp-limpar:hover{background:#F1F1F1;color:var(--dlp-preto)}\n.dlp-limpar[hidden],.dlp-procura[hidden]{display:none}\n.dlp mark{background:#FFE0D1;color:inherit;padding:0 1px;border-radius:2px}\n.dlp-encontrados{font-size:13px;color:var(--dlp-suave)}\n.dlp-vencedor{display:flex;align-items:center;gap:15px;margin:0 0 14px;padding:15px 18px;\nborder-radius:12px;background:var(--dlp-laranja);color:#fff}\n.dlp-vencedor-tacea{flex:none;font-size:30px;line-height:1}\n.dlp-vencedor-txt{min-width:0}\n.dlp-vencedor-txt span{display:block;font-size:11px;font-weight:700;letter-spacing:.14em;\ntext-transform:uppercase;opacity:.85;margin-bottom:3px}\n.dlp-vencedor-txt b{display:block;font-size:22px;font-weight:800;letter-spacing:-.01em;\nline-height:1.15;overflow-wrap:break-word}\n.dlp-vencedor-txt em{display:block;font-style:normal;font-size:13px;opacity:.9;margin-top:3px}\n.dlp-premios{margin:0 0 20px}\n.dlp-quadro{border:1px solid #EDE3DE;border-radius:12px;background:#FFFCFB;padding:14px 16px}\n.dlp-quadro-topo{display:flex;align-items:baseline;gap:9px;margin-bottom:11px;flex-wrap:wrap}\n.dlp-quadro-topo h3{margin:0;font-size:12px;font-weight:800;letter-spacing:.13em;\ntext-transform:uppercase;color:var(--dlp-laranja)}\n.dlp-quadro-topo span{font-size:12px;color:var(--dlp-suave)}\n.dlp-lugares{list-style:none;margin:0;padding:0}\n.dlp-lug{display:flex;align-items:flex-start;gap:10px;padding:5px 0}\n.dlp-lug .dlp-lugar{flex:none;margin-top:1px}\n.dlp-lug-txt{font-size:13px;line-height:1.4;color:var(--dlp-preto)}\n.dlp-lug-txt i{font-style:normal;color:#C9C2BE;margin:0 5px}\n.dlp-mes-box{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;\nmargin-top:10px;padding-top:10px;border-top:1px solid #F0E7E2}\n.dlp-mes-box b{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;\ncolor:var(--dlp-laranja);flex:none}\n.dlp-mes-box span{font-size:13px;line-height:1.4;color:var(--dlp-preto)}\n.dlp-nota{margin:9px 0 0;font-size:11px;color:var(--dlp-suave);line-height:1.4}\n.dlp-premiada{background:linear-gradient(90deg,#FFF4EF,rgba(255,244,239,0) 62%)}\n.dlp-troco{margin-left:7px;font-size:12px;vertical-align:1px}\n.dlp-jogo-semana td{background:linear-gradient(90deg,#FFF4EF,rgba(255,244,239,0) 75%)}\n.dlp-etiq-semana{display:inline-block;margin-left:9px;padding:2px 8px 1px;border-radius:20px;\nbackground:var(--dlp-laranja);color:#fff;font-size:10px;font-weight:700;\nletter-spacing:.06em;text-transform:uppercase;vertical-align:2px;white-space:nowrap}\n.dlp-curiosidades{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 18px}\n.dlp-curio{border:1px solid var(--dlp-linha);border-radius:10px;padding:11px 13px;min-width:0}\n.dlp-curio span{display:block;font-size:10px;font-weight:700;letter-spacing:.1em;\ntext-transform:uppercase;color:var(--dlp-suave);margin-bottom:5px;line-height:1.3}\n.dlp-curio b{display:block;font-size:15px;font-weight:700;line-height:1.25;\noverflow-wrap:break-word}\n.dlp-curio em{font-style:normal;font-size:11.5px;color:var(--dlp-suave)}\n.dlp-abas{display:flex;gap:4px;border-bottom:1px solid var(--dlp-linha);\nmargin-bottom:16px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;\nscrollbar-width:none}\n.dlp-abas::-webkit-scrollbar{display:none}\n.dlp-aba{flex:none;border:0;background:none;cursor:pointer;font:inherit;\nfont-size:13px;font-weight:600;color:var(--dlp-suave);\npadding:9px 13px 10px;border-bottom:2px solid transparent;margin-bottom:-1px;\nwhite-space:nowrap;border-radius:6px 6px 0 0}\n.dlp-aba:hover{color:var(--dlp-preto);background:#F6F6F6}\n.dlp-aba[aria-selected=\"true\"]{color:var(--dlp-laranja);border-bottom-color:var(--dlp-laranja)}\n.dlp-aba[hidden]{display:none}\n.dlp-paginas{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:14px}\n.dlp-pag{width:30px;height:30px;border-radius:50%;border:1px solid var(--dlp-linha);\nbackground:#fff;color:var(--dlp-preto);font-size:17px;line-height:1;cursor:pointer;\ndisplay:flex;align-items:center;justify-content:center;padding:0 0 2px}\n.dlp-pag:hover:not(:disabled){background:var(--dlp-laranja);border-color:var(--dlp-laranja);color:#fff}\n.dlp-pag:disabled{opacity:.3;cursor:default}\n.dlp-paginas span{font-size:13px;color:var(--dlp-suave);font-variant-numeric:tabular-nums}\n.dlp-destaque{margin:44px 0 16px;padding-bottom:12px;border-bottom:3px solid var(--dlp-laranja)}\n.dlp-destaque h3{margin:0;font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.15}\n.dlp-destaque h3 span{display:block;font-size:12px;font-weight:700;letter-spacing:.14em;\ntext-transform:uppercase;color:var(--dlp-laranja);margin-bottom:2px}\n.dlp-vazio{color:var(--dlp-suave);font-size:14px;font-style:italic}\n.dlp-rodape{margin-top:24px;font-size:13px;color:var(--dlp-suave)}\n@media (max-width:520px){\n.dlp-topo h2{font-size:24px}\n.dlp-destaque h3{font-size:21px}\n.dlp-quadro{padding:12px 13px}\n.dlp-lug-txt,.dlp-mes-box span{font-size:12.5px}\n.dlp-curiosidades{grid-template-columns:1fr;gap:7px}\n.dlp-curio{display:flex;align-items:baseline;gap:9px;padding:9px 12px}\n.dlp-curio span{margin-bottom:0;flex:none;max-width:96px}\n.dlp-curio b{font-size:14px}\n.dlp-aba{padding:8px 10px;font-size:12.5px}\n.dlp-tabela{font-size:14px}\n.dlp-tabela td{padding:9px 6px}\n.dlp-detalhe li{font-size:13px}\n.dlp-picks{width:98px}\n.dlp-p{width:24px}\n.dlp-op{margin-left:2px}\n.dlp-hist-numeros{grid-template-columns:repeat(2,1fr)}\n.dlp-hist{padding:12px 10px 10px}\n}");
