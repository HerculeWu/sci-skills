import json, re
ROOT="/Users/wenjie/programm/astro/tidal_tails_numerical_compare/literatures"
CLAIM_HDR=re.compile(r'^\s*(?:#+\s*Claim\b|\*\*Claim:?\*\*:?)',re.I|re.M)
SEC=re.compile(r'^\s*(?:#+\s*|\*\*)(Claim|Grounds|Warrant|Backing|Qualifier|Rebuttal)\b:?(?:\*\*)?:?[ \t]*',re.I|re.M)
def load(p):
    d=json.load(open(f"{ROOT}/{p}/{p}.canvas"))
    nodes={n['id']:n for n in d['nodes']}
    return nodes, d['edges']
def header(t):
    m=CLAIM_HDR.search(t)
    return t[:m.start()] if m else t
def kind(nid,t):
    """N/E/I from the marker in the header region (before the Claim section); '?' if no Claim section"""
    if not CLAIM_HDR.search(t): return 'X'   # not an argument card (e.g. identity card)
    h=header(t)
    # also allow a trailing marker line like 'Type: Native Argument'
    tail="\n".join(l for l in t.split("\n") if re.match(r'^\s*(\*\*)?(Type|Kind|Role|Status)\b',l,re.I))
    s=h+"\n"+tail
    n=bool(re.search(r'native\s+argument',s,re.I)); e=bool(re.search(r'end\s+argument',s,re.I))
    if n and e: return 'NE'
    return 'N' if n else 'E' if e else 'I'
def sections(t):
    out={}; ms=list(SEC.finditer(t))
    for i,m in enumerate(ms):
        end=ms[i+1].start() if i+1<len(ms) else len(t)
        body=t[m.end():end]
        # cut trailing Source:/Cites: lines from last section
        body=re.split(r'\n\s*(?:\*\*)?(?:Source|Cites)\b',body)[0]
        out.setdefault(m.group(1).capitalize(),body.strip())
    return out
def source_line(t):
    m=re.search(r'^\s*(?:\*\*)?Source:?(?:\*\*)?:?\s*(.*)$',t,re.M)
    return m.group(1).strip() if m else ''
def cites(t):
    return re.findall(r'^\s*(?:[-*]\s*)?(?:\*\*)?Cites:?(?:\*\*)?:?\s*(.*)$',t,re.M)
def title(t):
    return re.sub(r'^#+\s*','',t.strip().split("\n")[0])
