"""analyze.py [PAPER ...]
Mechanical graph counts for the simulation-structure check.
Inputs : per-paper canvases (read-only) + labels.json (hand labels = reader's judgment, see _legend).
Kinds  : N/E/I read from the marker in each card's header (canvaslib.kind).
Variant A: simulation-grounded = labels D + SD.   Variant B: = D only (SD treated as pure setup).
First-contact = simulation-grounded card with no simulation-grounded ancestor (any edge label).
"""
import json, sys, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from canvaslib import *
HERE=os.path.dirname(os.path.abspath(__file__))
L=json.load(open(os.path.join(HERE,"labels.json")))
def run(p):
    nodes,edges=load(p)
    K={i:kind(i,n.get('text','')) for i,n in nodes.items()}
    args=[i for i in nodes if K[i]!='X']
    lab=dict(L[p]["labels"]); camp=L[p].get("campaign",{})
    miss=[i for i in args if K[i]!='N' and i not in lab]
    assert not miss, f"unlabelled non-native cards: {miss}"
    for i in args: lab.setdefault(i,'O')
    unknown=[i for i in lab if i not in nodes]; assert not unknown, unknown
    inc=collections.defaultdict(list); out=collections.defaultdict(list)
    for e in edges:
        inc[e['toNode']].append((e.get('label'),e['fromNode'])); out[e['fromNode']].append((e.get('label'),e['toNode']))
    def anc(i,labels=None):
        seen=set(); st=[i]
        while st:
            x=st.pop()
            for l,s in inc[x]:
                if labels and l not in labels: continue
                if s not in seen: seen.add(s); st.append(s)
        return seen
    def desc(i):
        seen=set(); st=[i]
        while st:
            x=st.pop()
            for l,t in out[x]:
                if t not in seen: seen.add(t); st.append(t)
        return seen
    # topo order
    indeg={i:len(inc[i]) for i in nodes}; q=[i for i in nodes if indeg[i]==0]; topo=[]
    while q:
        x=q.pop(); topo.append(x)
        for l,t in out[x]:
            indeg[t]-=1
            if indeg[t]==0: q.append(t)
    acyclic=len(topo)==len(nodes)
    ends=[i for i in args if K[i]=='E']; nat=[i for i in args if K[i]=='N']
    setup=[i for i in args if lab[i] in('S','SD')]
    print("="*100); print(p, f"| argument cards {len(args)} | Native {len(nat)} | End {len(ends)} | intermediate {len(args)-len(nat)-len(ends)} | edges {len(edges)} | acyclic {acyclic}")
    cnt=collections.Counter(lab[i] for i in args if K[i]!='N' or lab[i]!='O'); print("  label counts (non-native + labelled natives):",dict(cnt))
    ne=[(l,s,t) for t in nat for l,s in inc[t]]
    if ne: print("  NOTE Native cards with incoming edges:", ne)
    eo=[(i,out[i]) for i in ends if out[i]]
    if eo: print("  NOTE End cards with outgoing edges:", eo)
    print("  SETUP cards:")
    for s in setup:
        print(f"    [{s}] kind={K[s]} label={lab[s]} cites={len(cites(nodes[s]['text']))}")
        for l,src in inc[s]: print(f"        {l} <- {src} ({K[src]}, {lab[src]})")
        ch=[t for l,t in out[s]]
        print(f"        direct children: {len(ch)}; of them sim-grounded(D/SD): {sum(lab[c] in('D','SD') for c in ch)}")
    for variant,SG in (("A (D+SD)",{'D','SD'}),("B (D only)",{'D'})):
        if variant.startswith("B") and not any(lab[i]=='SD' for i in args): continue
        sg=[i for i in args if lab[i] in SG]
        fc=[i for i in sg if not any(lab[a] in SG for a in anc(i))]
        fc_gw=[i for i in sg if not any(lab[a] in SG for a in anc(i,{'Grounds','Warrant'}))]
        dep=set()
        for i in sg: dep|=desc(i); dep.add(i)
        print(f"  --- variant {variant}: sim-grounded cards {len(sg)} (of them End: {sum(K[i]=='E' for i in sg)}); cards that are or descend from a sim-grounded card: {len(dep)}")
        print(f"      first-contact cards: {len(fc)} {fc}")
        if set(fc)!=set(fc_gw): print(f"      (using only Grounds/Warrant edges for 'upstream': {fc_gw})")
        for i in fc:
            gw=[(l,s) for l,s in inc[i] if l in('Grounds','Warrant')]
            alln=all(K[s]=='N' for l,s in gw)
            print(f"      FC [{i}] kind={K[i]} | all Grounds/Warrant inputs Native: {alln}")
            for l,s in inc[i]: print(f"           {l} <- {s} ({K[s]}, {lab[s]})")
        # edges among first-contact cards (zero by construction) and shared setup parents
        par=collections.Counter(s for i in fc for l,s in inc[i] if lab[s] in('S','SD'))
        print(f"      first-contact cards per setup parent: {dict(par)}")
        # campaigns
        if camp:
            for c in sorted(set(camp.values())):
                cs=[i for i in sg if camp.get(i)==c]
                cfc=[i for i in cs if not any(camp.get(a)==c and lab[a] in SG for a in anc(i))]
                print(f"      campaign '{c}': sim-grounded {len(cs)}; first-contact within campaign {cfc}")
                for i in cfc:
                    up=[a for a in anc(i) if lab[a] in SG]
                    print(f"           [{i}] in: {[(l,s,K[s],lab[s]) for l,s in inc[i]]}; sim-grounded ancestors from other campaigns: {sorted(up)}")
        # path lengths from FC to End
        NEG=-10**9; lo={i:10**9 for i in nodes}; hi={i:NEG for i in nodes}
        for i in fc: lo[i]=0; hi[i]=0
        pred={}
        for x in topo:
            for l,t in out[x]:
                if hi[x]>NEG and hi[x]+1>hi[t]: hi[t]=hi[x]+1; pred[t]=(x,l)
                if lo[x]<10**9: lo[t]=min(lo[t],lo[x]+1)
        dmin=collections.Counter(); dmax=collections.Counter(); indep=[]
        for e in ends:
            if hi[e]==NEG: indep.append(e)
            else: dmin[lo[e]]+=1; dmax[hi[e]]+=1
            print(f"      End [{e}] label={lab[e]} shortest={lo[e] if hi[e]>NEG else '-'} longest={hi[e] if hi[e]>NEG else '-'} | reached from setup: {any(lab[a] in('S','SD') for a in anc(e))}")
        print(f"      longest FC->End chain (edges): {max([hi[e] for e in ends if hi[e]>NEG],default=None)}")
        best=max([e for e in ends if hi[e]>NEG],key=lambda e:hi[e],default=None)
        if best is not None:
            path=[best]; x=best
            while x in pred: x,l=pred[x]; path.append(f"-{l}->"); path.append(x)
            print("      one longest chain:", " ".join(reversed(path)))
        print(f"      End distribution by SHORTEST distance: {dict(sorted(dmin.items()))} | by LONGEST distance: {dict(sorted(dmax.items()))}")
        print(f"      End Arguments with no sim-grounded ancestor: {len(indep)} {indep}")
        # same, following only Grounds/Warrant edges
        gw_indep=[e for e in ends if lab[e] not in SG and not any(lab[a] in SG for a in anc(e,{'Grounds','Warrant'}))]
        print(f"      End Arguments with no sim-grounded ancestor along Grounds/Warrant edges only: {len(gw_indep)} {gw_indep}")
        for e in ends:
            direct=[(l,s,lab[s]) for l,s in inc[e]]
            print(f"      End [{e}] direct inputs by label-of-source: {dict(collections.Counter(x[2] for x in direct))} | Grounds inputs: {[(s,lab[s]) for l,s in inc[e] if l=='Grounds']}")
        # children of setup cards: how many sim-grounded, how many first-contact, edges among them
        for s in setup:
            ch=[t for l,t in out[s] if lab[t] in SG]
            ee=[(a,l,b) for a in ch for l,b in out[a] if b in ch]
            print(f"      setup [{s}]: sim-grounded direct children {len(ch)}, of them first-contact {sum(c in fc for c in ch)}, edges among these children {len(ee)}")
    # cards that take a sim-grounded card as Grounds/Warrant and are setup/design cards
    for s in setup:
        up=[(l,src,lab[src]) for l,src in inc[s] if lab[src] in('D','SD','R','X')]
        print(f"  setup [{s}] inputs that are simulation-based (D/SD/R/X): {up}; sim-grounded ancestors: {sorted(a for a in anc(s) if lab[a] in('D','SD'))}")
for p in (sys.argv[1:] or [k for k in L if not k.startswith('_')]): run(p)
