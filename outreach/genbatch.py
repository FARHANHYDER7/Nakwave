#!/usr/bin/env python3
"""Emit a ready-to-paste browser_batch actions array for emails [A,B)."""
import json, sys, urllib.parse
TAB=966818641
B = ('const T=%s;const b=document.querySelector(\'div[g_editable="true"][role="textbox"]\');'
 'b.focus();while(b.firstChild)b.removeChild(b.firstChild);'
 'for(const p of T.split("\\n\\n")){const d=document.createElement("div");'
 'p.split("\\n").forEach((ln,i)=>{if(i)d.appendChild(document.createElement("br"));'
 'ln.split(/(https?:\\/\\/\\S+)/).forEach(t=>{if(/^https?:\\/\\//.test(t)){'
 'const a=document.createElement("a");a.href=t;a.textContent=t;a.style.color="#1a73e8";'
 'if(t.includes("audit-sample"))a.style.fontWeight="bold";d.appendChild(a);}'
 'else if(t)d.appendChild(document.createTextNode(t));});});b.appendChild(d);'
 'const e=document.createElement("div");e.appendChild(document.createElement("br"));b.appendChild(e);}'
 'b.removeChild(b.lastChild);'
 'const r=document.createRange();r.selectNodeContents(b);r.collapse(false);'
 'const s=window.getSelection();s.removeAllRanges();s.addRange(r);'
 'document.execCommand("insertText",false," ");document.execCommand("delete");'
 'await new Promise(z=>setTimeout(z,1800));'
 'JSON.stringify({n:%d,a:b.querySelectorAll("a").length,len:b.innerText.length});')
d=json.load(open("emails2.json"))
acts=[]
for i in range(int(sys.argv[1]), min(int(sys.argv[2]), len(d))):
    o=d[i]
    url=("https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to="+urllib.parse.quote(o["to"])
         +"&su="+urllib.parse.quote(o["subject"]))
    acts.append({"name":"navigate","input":{"tabId":TAB,"url":url}})
    acts.append({"name":"computer","input":{"tabId":TAB,"action":"wait","duration":6}})
    acts.append({"name":"javascript_tool","input":{"tabId":TAB,"action":"javascript_exec",
                 "text": B % (json.dumps(o["text"], ensure_ascii=False), i)}})
    acts.append({"name":"computer","input":{"tabId":TAB,"action":"wait","duration":2}})
print(json.dumps(acts, ensure_ascii=False))
