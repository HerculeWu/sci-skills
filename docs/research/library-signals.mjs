// Counts behind docs/research/library-signals.md. Reads only; needs Node 18+.
// node library-signals.mjs <library.canvas> <README.md of the library directory>
// Card formats differ between papers, so the parser accepts both `## Claim` headings and `**Claim:**` labels,
// and reads the Native / End marker from the first six lines of a card.
import fs from 'node:fs';
const canvas = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const readme = fs.readFileSync(process.argv[3], 'utf8');
const EL = ['Claim', 'Grounds', 'Warrant', 'Backing', 'Qualifier', 'Rebuttal', 'Audit Note'];
const name = s => EL.find(e => e.toLowerCase() === s.toLowerCase());
const cards = canvas.nodes.filter(n => n.type === 'text').map(n => {
  const i = n.id.indexOf(':'), key = n.id.slice(0, i), id = n.id.slice(i + 1), lines = n.text.split('\n');
  const sec = {}; let cur = '_head';
  for (const l of lines) {                       // element = `## Claim` heading or `**Claim:**` label
    let m = l.match(/^#{1,4}\s+(Claim|Grounds|Warrant|Backing|Qualifier|Rebuttal|Audit Note)s?\b/i);
    if (m) { cur = name(m[1]); sec[cur] ??= ''; continue; }
    m = l.match(/^\*\*(Claim|Grounds|Warrant|Backing|Qualifier|Rebuttal|Audit Note)s?:?\*\*:?\s*(.*)$/i);
    if (m) { cur = name(m[1]); sec[cur] = (sec[cur] ?? '') + m[2] + '\n'; continue; }
    if (/^(Source|Cites):/.test(l)) cur = '_tail';
    sec[cur] = (sec[cur] ?? '') + l + '\n';
  }
  const head = lines.slice(0, 6).join('\n'), isId = id === 'paper';
  return { nid: n.id, key, isId, text: n.text, sec, native: !isId && /Native Argument/.test(head), end: !isId && /End Argument/.test(head),
    cites: lines.filter(l => /^Cites:/.test(l)) };
});
const edges = canvas.edges.map(e => ({ from: e.fromNode, to: e.toNode, label: e.label, cross: e.fromNode.split(':')[0] !== e.toNode.split(':')[0] }));
const args = cards.filter(c => !c.isId);
// "near": core = the card's own text is about how a cluster or its tails are computed; ring = one edge away from the core
const SEED = /\bNBODY\s?[4-7]|\bPeTar\b|\bP3T\b|tree[- ]?code|\bHermite\b|leapfrog|\bAMUSE\b|\bGalpy\b|\bgalpy\b|direct\s+\$?N\$?-?\s?body|\$?N\$?-body (code|integrat|simulation|model|comput|run)|\bN-?body (code|integrat|simulation|model|comput|run)|softening|softened|regulari[sz]|time[- ]?step|particle[- ]spray|streakline|test[- ]particle|restricted (three|N)|\bintegrator\b|orbit integration|integrat(ed|ing|ion) (of )?(the )?(orbits?|stars?|particles?|escap|tail)|force (calculation|computation)|\bGPU\b|\bPhantom of Ramses\b|\bPoR\b|Milgrom-law.*integrat|semi-?analytic/i;
const core = new Set(args.filter(c => SEED.test(c.text)).map(c => c.nid));
const near = new Set(core);
for (const e of edges) { if (core.has(e.from)) near.add(e.to); if (core.has(e.to)) near.add(e.from); }
const out = {}, inn = {};
for (const e of edges) { (out[e.from] ??= []).push(e); (inn[e.to] ??= []).push(e); }
const impl = s => s !== undefined && /\(implicit\)/.test(s);
const S = {
  'argument cards': () => true,
  'Audit Note': c => c.sec['Audit Note'] !== undefined,
  '(implicit) Warrant': c => impl(c.sec.Warrant),
  'Qualifier': c => c.sec.Qualifier !== undefined,
  'Qualifier with "not tested"-like wording': c => /not tested|stated, not|not shown|no run|not examined|untested|conjecture, not|by eye|not quantified|is not reported|not discussed|no (convergence|accuracy) test|without testing|not addressed/i.test(c.sec.Qualifier ?? ''),
  'Rebuttal section': c => c.sec.Rebuttal !== undefined,
  'on a Rebuttal edge': c => [...(out[c.nid] ?? []), ...(inn[c.nid] ?? [])].some(e => e.label === 'Rebuttal'),
  'Native Argument': c => c.native,
  'Native, out-degree >= 3': c => c.native && (out[c.nid] ?? []).length >= 3,
  'End Argument': c => c.end,
  'none of Audit/implicit/Qualifier/Rebuttal': c => !(c.sec['Audit Note'] !== undefined || impl(c.sec.Warrant) || c.sec.Qualifier !== undefined || c.sec.Rebuttal !== undefined),
};
console.log('signal | library | core | ring');
for (const [k, f] of Object.entries(S)) { const a = args.filter(f); console.log(`${k} | ${a.length} | ${a.filter(c => core.has(c.nid)).length} | ${a.filter(c => near.has(c.nid) && !core.has(c.nid)).length}`); }
console.log('cards whose text contains "Audit Note":', cards.filter(c => /audit note/i.test(c.text)).length, '| contains "(implicit)":', cards.filter(c => /\(implicit\)/.test(c.text)).length);
const reb = edges.filter(e => e.label === 'Rebuttal');
console.log('Rebuttal edges', reb.length, 'cross-paper', reb.filter(e => e.cross).length, 'touching core', reb.filter(e => core.has(e.from) || core.has(e.to)).length, 'cross touching core', reb.filter(e => e.cross && (core.has(e.from) || core.has(e.to))).length);
const hist = {}; for (const c of args) if (c.native && core.has(c.nid)) { const d = (out[c.nid] ?? []).length; hist[d] = (hist[d] || 0) + 1; }
console.log('out-degree of core Native Arguments', JSON.stringify(hist));
// papers not joined by any link, and End Arguments in them
const keys = [...new Set(cards.map(c => c.key))], linked = new Set();
for (const e of edges) if (e.cross) linked.add([e.from.split(':')[0], e.to.split(':')[0]].sort().join('|'));
const nEnd = (k, set) => args.filter(c => c.key === k && c.end && set.has(c.nid)).length;
for (const [label, set] of [['core', core], ['near', near]]) {
  const P = keys.filter(k => nEnd(k, set) > 0); let un = 0, cp = 0, tot = 0;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { tot++; if (!linked.has([P[i], P[j]].sort().join('|'))) { un++; cp += nEnd(P[i], set) * nEnd(P[j], set); } }
  console.log(`${label}: papers with an End Argument ${P.length}, paper pairs ${tot}, unlinked ${un}, End-End card pairs across unlinked papers ${cp}`);
}
console.log('paper pairs', keys.length * (keys.length - 1) / 2, 'linked', linked.size, '| papers with no link:', keys.filter(k => ![...linked].some(l => l.split('|').includes(k))).join(' '));
// citations outside the set: a Cites line is in-set when it has surname + year + volume + page (or arXiv id) of a library paper (from the README bibcodes)
const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const lib = [];
for (const row of readme.split('\n')) {
  const m = row.match(/^\|\s*\d+\s*\|\s*(\w+)\s*\|[^|]*\|\s*([^|]+?)\s*\|\s*(\d{4})\s*\|\s*\[([^\]]+)\]/); if (!m) continue;
  const bib = m[4];
  lib.push({ surname: strip(m[2].replace(/ et al\.?/, '').trim().split(/\s+/).slice(-1)[0].replace(/-/g, '')), year: m[3], vol: (bib.slice(9, 13).match(/\d+/) || [''])[0], page: (bib.slice(13, 18).match(/\d+/) || [''])[0], arx: bib.includes('arXiv') ? bib.slice(9, 18).replace(/\D/g, '') : '' });
}
const inSet = line => { const s = strip(line).replace(/-/g, ''); return lib.some(p => s.includes(p.surname.slice(0, 5)) && ((p.arx && s.replace(/[.\s]/g, '').includes(p.arx.replace(/^0+/, '').slice(0, 4)) && s.includes(p.arx.slice(-5))) || (s.includes(p.year) && p.vol && p.page && new RegExp(`\\b${p.vol}\\b`).test(s) && new RegExp(`\\b[al]?${p.page}\\b`).test(s)))); };
const refKey = line => { const s = strip(line.replace(/^Cites:\s*/, '')); return s.replace(/^[^a-z]*/, '').split(/[,.&]| and | et al/)[0].trim().replace(/\s+[a-z]$/, '') + ' ' + (s.match(/\b(1[89]\d\d|20\d\d)/) || [''])[0]; };
let all = 0, outN = 0, coreAll = 0, coreOut = 0; const refs = new Map();
for (const c of args) for (const l of c.cites) { all++; const isCore = core.has(c.nid); if (isCore) coreAll++; if (inSet(l)) continue; outN++; if (isCore) coreOut++; const r = refs.get(refKey(l)) ?? refs.set(refKey(l), { core: new Set(), papers: new Set() }).get(refKey(l)); if (isCore) { r.core.add(c.nid); r.papers.add(c.key); } }
console.log('Cites lines', all, 'out-of-set', outN, '| on core cards', coreAll, 'out-of-set', coreOut, '| distinct out-of-set references', refs.size, 'cited by core', [...refs.values()].filter(r => r.core.size).length);
console.log([...refs.entries()].filter(([, r]) => r.core.size).sort((a, b) => b[1].papers.size - a[1].papers.size || b[1].core.size - a[1].core.size).slice(0, 20).map(([k, r]) => `${k} (${r.papers.size} papers, ${r.core.size} cards)`).join('; '));
// smaller counts quoted in the note
const cls = t => /^\s*Cites \w+ for/.test(t) ? 'cited paper has no such argument' : /^\s*Restates \w+ (more strongly|differently)/.test(t) ? 'restated more strongly or differently'
  : /circular|Model-dependent selection|Part of/i.test(t.slice(0, 60)) ? 'circular dependency' : /^\s*No path/.test(t) ? 'no path to an End Argument' : 'other';
const ac = {};
for (const c of args) if (c.sec['Audit Note'] !== undefined) for (const k of new Set(c.sec['Audit Note'].trim().split(/\n+/).filter(Boolean).map(cls))) { const r = ac[k] ??= [0, 0]; r[0]++; if (near.has(c.nid)) r[1]++; }
console.log('Audit Note classes [library, core+ring]', JSON.stringify(ac));
console.log('papers with `## Claim` headings', new Set(args.filter(c => /^#{2,4} Claim/m.test(c.text)).map(c => c.key)).size, '| with `**Claim:**` labels', new Set(args.filter(c => /^\*\*Claim/m.test(c.text)).map(c => c.key)).size);
console.log('core Native Arguments with an (implicit) Warrant', args.filter(c => c.native && core.has(c.nid) && impl(c.sec.Warrant)).length);
const NOTE = /reader'?s note|not in the paper|not addressed in the paper|not discussed in the paper/i;
console.log('cards with a reader\'s note', args.filter(c => NOTE.test(c.text)).length, 'core', args.filter(c => NOTE.test(c.text) && core.has(c.nid)).length);
const TRUST = /published.{0,40}(tested|validated)|tested.{0,30}code|long-established|trustworthy|can be trusted|reliable cluster evolution|validated in the cited/i;
console.log('Warrants worded as "a published, tested code is reliable"', args.filter(c => TRUST.test(c.sec.Warrant ?? '')).length);
const NOORBIT = new RegExp(SEED.source.replace('\\bGalpy\\b|\\bgalpy\\b|', '').replace('orbit integration|integrat(ed|ing|ion) (of )?(the )?(orbits?|stars?|particles?|escap|tail)|', ''), 'i');
console.log('core cards matched only by galpy / orbit-integration wording', args.filter(c => core.has(c.nid) && !NOORBIT.test(c.text)).map(c => c.nid).join(' '));
