function m(){if(!window.location.href.includes("/task/"))return;const a=document.querySelector(".content");if(!a)return;const l=a.querySelectorAll("pre");if(l.length===0)return;const d=document.createElement("style");d.textContent=`
    .cses-cf-box {
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 1em;
      overflow: hidden;
      background-color: var(--bg-color, #fff);
    }
    html.dark .cses-cf-box, body.dark .cses-cf-box {
      border-color: #475569;
      background-color: #1e293b;
    }
    .cses-cf-title {
      background-color: #f3f4f6;
      border-bottom: 1px solid #ccc;
      padding: 4px 12px;
      font-family: sans-serif;
      font-size: 13px;
      font-weight: bold;
      color: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    html.dark .cses-cf-title, body.dark .cses-cf-title {
      background-color: #334155;
      border-bottom-color: #475569;
      color: #e2e8f0;
    }
    .cses-cf-copy {
      cursor: pointer;
      color: #2563eb;
      font-weight: normal;
    }
    .cses-cf-copy:hover {
      text-decoration: underline;
    }
    html.dark .cses-cf-copy, body.dark .cses-cf-copy {
      color: #60a5fa;
    }
    .cses-cf-box pre {
      margin: 0 !important;
      padding: 12px !important;
      border: none !important;
      background: transparent !important;
    }
  `,document.head.appendChild(d),l.forEach(t=>{var p,f;let s="Code",o=t.previousElementSibling;if(o&&o.tagName==="P"){const r=((p=o.textContent)==null?void 0:p.trim())||"";r.toLowerCase().startsWith("input")?(s="Input",o.style.display="none"):r.toLowerCase().startsWith("output")&&(s="Output",o.style.display="none")}const n=document.createElement("div");n.className="cses-cf-box";const c=document.createElement("div");c.className="cses-cf-title";const i=document.createElement("span");i.textContent=s;const e=document.createElement("span");e.className="cses-cf-copy",e.textContent="Copy",e.addEventListener("click",()=>{const r=t.textContent||"";navigator.clipboard.writeText(r).then(()=>{e.textContent="Copied!",setTimeout(()=>{e.textContent="Copy"},2e3)}).catch(u=>{console.error("Failed to copy",u)})}),c.appendChild(i),c.appendChild(e),n.appendChild(c),(f=t.parentNode)==null||f.insertBefore(n,t),n.appendChild(t)})}function x(){m()}export{x as onExecute};
