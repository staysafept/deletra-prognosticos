/**
 * Corre no GitHub, de 20 em 20 minutos, sem o PC ligado.
 *
 * Le jornadas.json (jogos + palpites, publicados pelo painel), vai buscar os
 * resultados a football-data.org e escreve dados.json — o ficheiro que a
 * pagina do Tilda le.
 *
 * A chave da API vem da variavel de ambiente TOKEN_FUTEBOL, guardada nos
 * "Secrets" do repositorio. Nunca fica escrita em lado nenhum publico.
 *
 * Sem dependencias: so o que o Node traz de origem.
 */

import fs from 'node:fs';

const BASE = 'https://api.football-data.org/v4';
const COMPETICAO = 'PPL';
const ADIADO = ['POSTPONED', 'SUSPENDED', 'CANCELLED'];

const token = (process.env.TOKEN_FUTEBOL || '').trim();
if (!token) {
  console.error('Falta o segredo TOKEN_FUTEBOL no repositorio.');
  process.exit(1);
}

const entrada = JSON.parse(fs.readFileSync('jornadas.json', 'utf8'));

/** "3-2" -> "1" | "X" | "2" */
function sinal(resultado) {
  const m = /^(\d+)\s*[-:x]\s*(\d+)$/.exec(String(resultado || '').trim());
  if (!m) return null;
  return +m[1] > +m[2] ? '1' : (+m[1] < +m[2] ? '2' : 'X');
}

async function buscar(numero) {
  const r = await fetch(`${BASE}/competitions/${COMPETICAO}/matches?matchday=${numero}`, {
    headers: { 'X-Auth-Token': token },
  });
  if (!r.ok) throw new Error(`jornada ${numero}: a API respondeu ${r.status}`);
  const d = await r.json();

  const porPar = new Map();
  for (const m of d.matches || []) {
    const casa = m.score?.fullTime?.home;
    const fora = m.score?.fullTime?.away;
    let resultado = '';
    if (ADIADO.includes(m.status)) resultado = 'Adiado';
    else if (m.status === 'FINISHED' && casa !== null && fora !== null) resultado = `${casa}-${fora}`;
    porPar.set(`${m.homeTeam?.id}|${m.awayTeam?.id}`, resultado);
  }
  return porPar;
}

const semanas = [];
let mudancas = 0;

for (const j of entrada.jornadas || []) {
  let porPar = new Map();
  try {
    porPar = await buscar(j.n);
  } catch (e) {
    console.error('  ! ' + e.message + ' — fica o resultado que ja estava');
  }

  const jogos = j.jogos.map((g) => {
    const fresco = porPar.get(`${g.idCasa}|${g.idFora}`);
    const resultado = fresco !== undefined && fresco !== '' ? fresco : (g.resultado || '');
    if (resultado && resultado !== g.resultado) mudancas++;
    return {
      casa: g.casa,
      fora: g.fora,
      resultado,
      certo: resultado === 'Adiado' ? null : sinal(resultado),
    };
  });

  semanas.push({
    n: j.n,
    mes: j.mes || '',                 // para a tabela dos melhores do mes
    nomeDoMes: j.nomeDoMes || '',
    ate: j.ate || '',                 // para o site abrir na jornada a decorrer
    jogos,
    jogosPontuados: jogos.filter((g) => g.certo).length,
    lista: (j.patronos || []).map((p) => ({ nome: p.nome, picks: p.picks })),
  });

  // o plano gratuito da API sao 10 pedidos por minuto
  await new Promise((r) => setTimeout(r, 1200));
}

const nucleo = {
  competicao: entrada.competicao,
  pontosPorAcerto: entrada.pontosPorAcerto ?? 3,
  fonte: '',
  premios: entrada.premios || { geral: 0, mes: '' },   // vem do jornadas.json
  semanas,
};

/* A hora de atualizacao so muda quando os dados mudam. Sem isto o ficheiro
   ficava diferente de 20 em 20 minutos e o repositorio enchia-se de gravacoes
   sem nada de novo. Assim "atualizado" quer mesmo dizer "quando os resultados
   mudaram pela ultima vez". */
let anterior = null;
try { anterior = JSON.parse(fs.readFileSync('dados.json', 'utf8')); } catch {}

const igual = anterior && JSON.stringify(nucleo) === JSON.stringify({
  competicao: anterior.competicao,
  pontosPorAcerto: anterior.pontosPorAcerto,
  fonte: anterior.fonte,
  premios: anterior.premios,
  semanas: anterior.semanas,
});

const saida = { ...nucleo, atualizado: igual ? anterior.atualizado : new Date().toISOString() };

fs.writeFileSync('dados.json', JSON.stringify(saida) + '\n', 'utf8');
console.log(igual
  ? `Nada mudou (${semanas.length} jornadas). Ficheiro deixado como estava.`
  : `dados.json escrito: ${semanas.length} jornadas, ${mudancas} resultados novos.`);
