#!/usr/bin/env python3
"""Rebuild dendrogram-data.js and matrix-data.js from data/minerals_data.json.

    python3 regenerate_derived.py REPO_DIR            # write both files
    python3 regenerate_derived.py REPO_DIR --check    # compare with the files on disk, write nothing

Method (the one described on the Groups page): each mineral is a vector of its fifteen
scores (the two sub-scores of each two-part vector, the single score of the other five),
each column z-scored with the population SD, then Ward linkage on Euclidean distance.
Leaf colours come from data/group_assignments.json; a join whose two branches are not
both a single, identical group is drawn in the cross-group colour.
The matrix is the mean of each of 14 rows per group, rounded to 2 decimals.
"""
import json, os, sys
import numpy as np
from scipy.cluster.hierarchy import linkage, dendrogram, fcluster
from collections import Counter, defaultdict

MIXED = "#cdbfa6"

def scores15(r):
    V = r["vectors"]; s = lambda k, x: V[k]["sub"][x]
    return [V["demand"]["score"], V["growth"]["score"],
            s("supplier_concentration", "mining_diversity"), s("supplier_concentration", "refining_diversity"),
            s("reserves", "timeframe"), s("reserves", "diversification"),
            s("end_use", "sectoral"), s("end_use", "breadth"),
            s("substitutability_recyclability", "substitutability"), s("substitutability_recyclability", "recyclability"),
            V["extraction_refining"]["score"], V["upcoming_projects"]["score"],
            s("india_position", "import_dependence"), s("india_position", "strategic_posture"),
            V["price_volatility"]["score"]]

ROWS = [  # label, getter, max  (the order and labels of the published matrix)
    ("Current Global Demand", lambda V: V["demand"]["score"], 5),
    ("Projected Demand Growth", lambda V: V["growth"]["score"], 5),
    ("Mining Supplier Diversity", lambda V: V["supplier_concentration"]["sub"]["mining_diversity"], 5),
    ("Refining Supplier Diversity", lambda V: V["supplier_concentration"]["sub"]["refining_diversity"], 5),
    ("Global Reserves (time-frame)", lambda V: V["reserves"]["sub"]["timeframe"], 5),
    ("Global Reserves (diversification)", lambda V: V["reserves"]["sub"]["diversification"], 5),
    ("End-use Applications (composite)", lambda V: V["end_use"]["composite"], 10),
    ("Substitutability", lambda V: V["substitutability_recyclability"]["sub"]["substitutability"], 5),
    ("Recyclability", lambda V: V["substitutability_recyclability"]["sub"]["recyclability"], 5),
    ("Extraction & Refining", lambda V: V["extraction_refining"]["score"], 5),
    ("Upcoming Projects", lambda V: V["upcoming_projects"]["score"], 5),
    ("India's Position (import dep.)", lambda V: V["india_position"]["sub"]["import_dependence"], 5),
    ("India's Position (strat. posture)", lambda V: V["india_position"]["sub"]["strategic_posture"], 5),
    ("Price Volatility", lambda V: V["price_volatility"]["score"], 5),
]

def load(repo):
    j = lambda p: json.load(open(os.path.join(repo, p), encoding="utf-8"))
    minerals = {r["mineral"]: r for r in j("data/minerals_data.json")["minerals"]}
    groups = j("data/group_assignments.json")
    crit = j("data/criteria_data.json")
    return minerals, groups, crit

def build(repo):
    M, G, crit = load(repo)
    assert set(M) == set(G), f"minerals and group_assignments differ: {set(M) ^ set(G)}"
    colour = {g["id"]: g["color"] for g in crit["groups"]}
    names = sorted(M)
    X = np.array([scores15(M[n]) for n in names], float)
    Z = (X - X.mean(0)) / X.std(0)
    L = linkage(Z, "ward")
    order = dendrogram(L, no_plot=True, labels=names)["ivl"]
    xpos = {n: i for i, n in enumerate(order)}
    node = {i: (float(xpos[n]), 0.0, {G[n]}) for i, n in enumerate(names)}  # id -> (x, height, groups)
    merges = []
    for k, (a, b, h, _) in enumerate(L):
        A, B = node[int(a)], node[int(b)]
        if A[0] > B[0]: A, B = B, A
        same = len(A[2]) == 1 and A[2] == B[2]
        merges.append({"ax": round(A[0], 3), "ah": round(A[1], 3), "bx": round(B[0], 3), "bh": round(B[1], 3),
                       "top": round(float(h), 3), "color": colour[next(iter(A[2]))] if same else MIXED, "height": round(float(h), 3)})
        node[len(names) + k] = ((A[0] + B[0]) / 2, float(h), A[2] | B[2])
    groups6 = [{"id": g["id"], "name": g["name"], "color": g["color"]} for g in crit["groups"] if g["id"] != 0]
    dendro = {"leaves": [{"name": n, "group": G[n], "color": colour[G[n]], "x": i} for i, n in enumerate(order)],
              "merges": merges, "maxHeight": round(float(L[-1, 2]), 3), "n": len(names), "groups": groups6}
    rows = []
    for label, get, mx in ROWS:
        vals = {g["id"]: round(float(np.mean([get(M[m]["vectors"]) for m in M if G[m] == g["id"]])), 2) for g in groups6}
        top = max(vals.values())
        rows.append({"label": label, "max": mx, "cells": [{"g": g, "v": v, "max": v == top} for g, v in vals.items()]})
    matrix = {"groups": groups6, "rows": rows}
    # tree cuts vs published groups: for each branch, its core group(s) and the minerals from other groups
    report = []
    for k in (6, 7, 8, 9):
        lab = fcluster(L, k, "maxclust"); by = defaultdict(list)
        for n, c in zip(names, lab): by[c].append(n)
        branches = []
        for mem in by.values():
            cnt = Counter(G[m] for m in mem)
            core = sorted(g for g, c in cnt.items() if c >= 3) or [cnt.most_common(1)[0][0]]
            guests = sorted((m, G[m]) for m in mem if G[m] not in core)
            branches.append((core, sum(cnt[g] for g in core), guests))
        branches.sort(key=lambda b: b[0])
        report.append((k, branches))
    return ("const DENDRO = " + json.dumps(dendro) + ";\n", "const MATRIX = " + json.dumps(matrix) + ";", report, dendro)

def main(repo, check=False, quiet=False):
    dtext, mtext, report, dendro = build(repo)
    out = {}
    for fname, text in (("dendrogram-data.js", dtext), ("matrix-data.js", mtext)):
        path = os.path.join(repo, fname)
        old = open(path, encoding="utf-8").read() if os.path.exists(path) else None
        out[fname] = (old == text)
        if not check and old != text:
            open(path, "w", encoding="utf-8").write(text)
        if not quiet:
            print(f"{fname}: {'unchanged' if old == text else ('differs from file on disk' if check else 'rewritten')}")
    if not quiet:
        print("Tree cuts against the published groups (use these to keep the methodology paragraph accurate):")
        for k, branches in report:
            print(f"  cut at {k}:")
            for core, n, guests in branches:
                g = " + ".join(f"G{x}" for x in core)
                extra = ", ".join(f"{m} (G{x})" for m, x in guests)
                print(f"    {g} core ({n})" + (f" + {extra}" if extra else ""))
    return out, report, dendro

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args: sys.exit(__doc__)
    main(args[0], check="--check" in sys.argv)
