function f(){if(!window.location.href.includes("/task/"))return;const a=document.querySelector(".content");if(!a)return;const s=a.querySelectorAll("pre");if(s.length===0)return;const l=document.createElement("style");l.textContent=`
    .cses-cf-box {
      border: 1px solid rgba(128, 128, 128, 0.3);
      border-radius: 4px;
      margin-bottom: 1em;
      overflow: hidden;
      background-color: rgba(128, 128, 128, 0.05);
      color: inherit;
    }
    .cses-cf-title {
      background-color: rgba(128, 128, 128, 0.15);
      border-bottom: 1px solid rgba(128, 128, 128, 0.3);
      padding: 4px 12px;
      font-family: sans-serif;
      font-size: 13px;
      font-weight: bold;
      color: inherit;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cses-cf-copy {
      cursor: pointer;
      color: #3b82f6; /* Blue that works well in both light and dark modes */
      font-weight: normal;
    }
    .cses-cf-copy:hover {
      text-decoration: underline;
    }
    .cses-cf-box pre {
      margin: 0 !important;
      padding: 12px !important;
      border: none !important;
      background: transparent !important;
      color: inherit !important;
    }
  `,document.head.appendChild(l),s.forEach(e=>{var p,u;let i="Code",n=e.previousElementSibling;if(n&&n.tagName==="P"){const c=((p=n.textContent)==null?void 0:p.trim())||"";c.toLowerCase().startsWith("input")?(i="Input",n.style.display="none"):c.toLowerCase().startsWith("output")&&(i="Output",n.style.display="none")}const o=document.createElement("div");o.className="cses-cf-box";const r=document.createElement("div");r.className="cses-cf-title";const d=document.createElement("span");d.textContent=i;const t=document.createElement("span");t.className="cses-cf-copy",t.textContent="Copy",t.addEventListener("click",()=>{const c=(e.textContent||"").trimEnd();navigator.clipboard.writeText(c).then(()=>{t.textContent="Copied!",setTimeout(()=>{t.textContent="Copy"},2e3)}).catch(m=>{console.error("Failed to copy",m)})}),r.appendChild(d),r.appendChild(t),o.appendChild(r),(u=e.parentNode)==null||u.insertBefore(o,e),o.appendChild(e)})}function x(){f()}export{x as onExecute};
