"""dump.py PAPER [GW] : print non-native cards (Claim, Grounds truncated, Source, in/out edges with kinds)"""
import sys, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from canvaslib import *
p=sys.argv[1]; GW=int(sys.argv[2]) if len(sys.argv)>2 else 900
only=set(sys.argv[3:])
nodes,edges=load(p)
K={i:kind(i,n.get('text','')) for i,n in nodes.items()}
def sq(s,w): 
    s=re.sub(r'\s+',' ',s); return s if len(s)<=w else s[:w]+' [...]'
for i,n in nodes.items():
    if only and i not in only: continue
    t=n.get('text',''); k=K[i]
    if k=='X': continue
    s=sections(t)
    inc=[f"{e.get('label','?')}<-{e['fromNode']}({K[e['fromNode']]})" for e in edges if e['toNode']==i]
    out=[f"{e.get('label','?')[0]}->{e['toNode']}({K[e['toNode']]})" for e in edges if e['fromNode']==i]
    if k=='N' and not only:
        print(f"## [{i}] N | {title(t)[:90]} | cites:{len(cites(t))} | OUT: {' '.join(out)}")
        print("   C:", sq(s.get('Claim',''),220))
        continue
    print(f"\n## [{i}] {k} | {title(t)[:110]}")
    print("   C:", sq(s.get('Claim','<<none>>'),400))
    print("   G:", sq(s.get('Grounds','<<none>>'),GW))
    print("   W:", sq(s.get('Warrant','<<none>>'),260))
    for x in ('Qualifier','Rebuttal'):
        if x in s: print(f"   {x[0]}:", sq(s[x],200))
    print("   Source:", source_line(t), "| cites:",len(cites(t)))
    print("   IN:", "; ".join(inc))
    print("   OUT:", " ".join(out))
