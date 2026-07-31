#!/usr/bin/env python3
"""Emit the browser-side JS that rebuilds a Gmail compose body as real DOM nodes.

Gmail enforces Trusted Types, so innerHTML and execCommand('insertHTML') both
throw. createElement/createTextNode are allowed. After building the tree we
fire a real insertText+delete so Gmail's dirty flag trips and the draft saves.

  python3 mkjs.py <file.json> <index>
"""
import json, sys
TPL = ('const B=%s;'
 'const b=document.querySelector(\'div[g_editable="true"][role="textbox"]\');b.focus();'
 'while(b.firstChild)b.removeChild(b.firstChild);'
 'for(const blk of B){const d=document.createElement("div");'
 'if(!blk.length){d.appendChild(document.createElement("br"));}'
 'for(const p of blk){'
 'if(p.br){d.appendChild(document.createElement("br"));}'
 'else if(p.a){const a=document.createElement("a");a.href=p.a;a.textContent=p.t;'
 'a.style.color="#1a73e8";if(p.b)a.style.fontWeight="bold";d.appendChild(a);}'
 'else{d.appendChild(document.createTextNode(p.t));}}'
 'b.appendChild(d);}'
 'const r=document.createRange();r.selectNodeContents(b);r.collapse(false);'
 'const s=window.getSelection();s.removeAllRanges();s.addRange(r);'
 'document.execCommand("insertText",false," ");document.execCommand("delete");'
 'await new Promise(z=>setTimeout(z,2200));'
 'JSON.stringify({a:[...b.querySelectorAll("a")].map(x=>x.href),len:b.innerText.length});')
d = json.load(open(sys.argv[1]))
o = d[int(sys.argv[2])]
print(TPL % json.dumps(o["blocks"], ensure_ascii=False))
