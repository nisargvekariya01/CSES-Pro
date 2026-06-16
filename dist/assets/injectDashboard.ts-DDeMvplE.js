import{c as b}from"./cses-problems-BDV4gcZH.js";import{g as S}from"./storage-39e_FlVG.js";const z=["Introductory Problems","Sorting and Searching","Dynamic Programming","Graph Algorithms","Range Queries","Tree Algorithms","Mathematics","String Algorithms","Geometry","Advanced Techniques","Additional Problems"];function h(t){return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}function C(t){const d=b,s={};for(const[r,o]of Object.entries(d))s[o.category]||(s[o.category]=[]),s[o.category].push(r);return z.filter(r=>{var o;return(o=s[r])==null?void 0:o.length}).map(r=>{const o=s[r],i=o.filter(a=>t[a]).length;return{name:r,solved:i,total:o.length,pct:o.length?i/o.length*100:0}})}function v(){const t=document.getElementById("styles-dark");return(t==null?void 0:t.rel)==="stylesheet"}function D(t,d,s){const r=d>0?t/d:0,o=52,i=70,a=70,e=2*Math.PI*o,n=r*e,c=e-n,g=s?"#e2e8f0":"#111827",p=s?"#94a3b8":"#6b7280",f=s?"#334155":"#e5e7eb",l=r>0?`
    <circle cx="${i}" cy="${a}" r="${o}"
      fill="none" stroke="#22c55e" stroke-width="22"
      stroke-dasharray="${n.toFixed(2)} ${c.toFixed(2)}"
      transform="rotate(-90 ${i} ${a})"
      stroke-linecap="butt"/>`:"";return`
  <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
    ${`
  <svg width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0;display:block;margin:0 auto">
    <!-- Track -->
    <circle cx="${i}" cy="${a}" r="${o}" fill="none" stroke="${f}" stroke-width="22"/>
    <!-- Solved arc -->
    ${l}
    <!-- Center text: percentage -->
    <text x="${i}" y="${a-8}" text-anchor="middle" dominant-baseline="middle"
      font-size="20" font-weight="700" fill="${g}" font-family="inherit">
      ${(r*100).toFixed(1)}%
    </text>
    <text x="${i}" y="${a+14}" text-anchor="middle" dominant-baseline="middle"
      font-size="11" fill="${p}" font-family="inherit">
      ${t} / ${d}
    </text>
  </svg>`}
    <div style="display:flex;gap:16px;font-size:12px;color:${g};font-weight:500">
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:10px;height:10px;border-radius:50%;background:#22c55e"></div>
        Solved
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:10px;height:10px;border-radius:50%;background:${f};border:1px solid ${s?"#475569":"#d1d5db"}"></div>
        <span style="color:${p}">Unsolved</span>
      </div>
    </div>
  </div>`}function T(t){const d=Object.keys(t).filter(n=>(t[n]??0)>0).sort();if(!d.length)return{cur:0,best:0};const s=new Date;s.setHours(0,0,0,0);const r=h(s),o=h(new Date(s.getTime()-864e5));let i=0;if((t[r]??0)>0||(t[o]??0)>0){let n=(t[r]??0)>0?s:new Date(s.getTime()-864e5);for(i=1;;){const c=new Date(n.getTime()-864e5);if((t[h(c)]??0)>0)i++,n=c;else break}}let a=0,e=1;for(let n=1;n<d.length;n++)(new Date(d[n]).getTime()-new Date(d[n-1]).getTime())/864e5===1?e++:(a=Math.max(a,e),e=1);return a=Math.max(a,e,i),{cur:i,best:a}}async function P(){const t=await S(),{username:d,solvedProblems:s,heatmapData:r}=t,o=v(),i=Object.keys(b).length,a=Object.keys(s).length,e=i>0?a/i*100:0,{cur:n,best:c}=T(r),g=C(s),p=o?"#2d3561":"#dee2e6",f=o?"#e2e8f0":"#222222",l=o?"#94a3b8":"#666666",x="#00a000",u=g.map(({name:w,solved:$,total:k,pct:y},M)=>{const m=y>=100?x:y>=50?"#2563eb":"#94a3b8";return`
      <tr style="border-bottom:1px solid ${p}">
        <td style="padding:8px 14px;font-size:14px;color:${f}">${w}</td>
        <td style="padding:8px 14px;text-align:right;font-size:13px;color:${l};white-space:nowrap">${$} / ${k}</td>
        <td style="padding:8px 14px;min-width:140px">
          <div style="background:${p};border-radius:999px;height:6px;overflow:hidden">
            <div style="width:${y.toFixed(1)}%;height:100%;background:${m};border-radius:999px"></div>
          </div>
        </td>
        <td style="padding:8px 14px;text-align:right;font-size:12px;font-weight:600;color:${m};white-space:nowrap;min-width:52px">${y.toFixed(1)}%</td>
      </tr>`}).join("");return`
<div id="cses-dashboard-panel" style="font-family:inherit">
<style>
  #cses-dashboard-panel .cses-db-section {
    margin-bottom: 24px;
  }
  #cses-dashboard-panel .cses-db-section-title {
    font-size:13px;font-weight:600;color:${l};text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px
  }
  #cses-dashboard-panel .cses-db-table { width:100%;border-collapse:collapse;border:1px solid ${p};border-radius:8px;overflow:hidden }
  #cses-dashboard-panel .cses-db-table thead tr { border-bottom: 2px solid ${p} }
  #cses-dashboard-panel .cses-db-table thead th { padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:${l};text-transform:uppercase;letter-spacing:.05em }
</style>

<!-- Title removed as it is now in the dropdown summary -->

<!-- Overall Progress (Pie chart + bar + streaks) -->
<div class="cses-db-section">
  <div class="cses-db-section-title">Overall Progress</div>
  <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap">

    <!-- Donut pie chart -->
    ${D(a,i,o)}

    <!-- Progress details + streaks -->
    <div style="flex:1;min-width:200px">
      <!-- Bar -->
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;font-weight:600;color:${f}">${a} / ${i} problems</span>
          <span style="font-size:13px;font-weight:700;color:${x}">${e.toFixed(1)}%</span>
        </div>
        <div style="background:${p};border-radius:999px;height:10px;overflow:hidden">
          <div style="width:${e.toFixed(1)}%;height:100%;background:linear-gradient(90deg,#15803d,#22c55e,#4ade80);border-radius:999px;transition:width 0.6s"></div>
        </div>
      </div>

      <!-- Streaks inline -->
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 0;flex:1;min-width:120px">
          <span style="font-size:22px">🔥</span>
          <div>
            <div style="font-size:18px;font-weight:700;color:#f97316;font-family:monospace;line-height:1">${n}</div>
            <div style="font-size:10px;color:${l}">day streak</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:10px 0;flex:1;min-width:120px">
          <span style="font-size:22px">🏆</span>
          <div>
            <div style="font-size:18px;font-weight:700;color:#a855f7;font-family:monospace;line-height:1">${c}</div>
            <div style="font-size:10px;color:${l}">best streak</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>



<!-- Category table -->
<table class="cses-db-table">
  <thead>
    <tr>
      <th>Category</th>
      <th style="text-align:right">Solved</th>
      <th>Progress</th>
      <th style="text-align:right">%</th>
    </tr>
  </thead>
  <tbody>${u}</tbody>
</table>

</div>`}async function E(){const t=document.querySelector(".content");if(!t||document.getElementById("cses-dashboard-wrapper")||!window.location.pathname.match(/\/(problemset|list)\/?$/))return;const s=document.createElement("div");s.id="cses-dashboard-wrapper",s.style.marginBottom="24px";const r=v(),o=r?"#2d3561":"#dee2e6",i=r?"#16213e":"#f8f9fa",a=r?"#e2e8f0":"#222222",e=document.createElement("div");e.style.cursor="pointer",e.style.fontSize="16px",e.style.fontWeight="600",e.style.padding="14px 18px",e.style.backgroundColor=i,e.style.border=`1px solid ${o}`,e.style.borderRadius="8px",e.style.color=a,e.style.display="flex",e.style.alignItems="center",e.style.justifyContent="space-between",e.style.transition="background-color 0.2s",e.onmouseenter=()=>e.style.backgroundColor=r?"#1e293b":"#e2e8f0",e.onmouseleave=()=>e.style.backgroundColor=i,e.innerHTML=`
    <span style="display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">📊</span> 
      <span>Progress Dashboard</span>
    </span>
    <span id="cses-db-arrow" style="font-size:12px;opacity:0.6;transition:transform 0.4s ease">▼</span>
  `,s.appendChild(e);const n=document.createElement("div");n.style.display="grid",n.style.gridTemplateRows="0fr",n.style.transition="grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)";const c=document.createElement("div");c.style.overflow="hidden";const g=document.createElement("div");g.style.padding="24px 0 8px 0",c.appendChild(g),n.appendChild(c),s.appendChild(n),t.insertBefore(s,t.firstChild);let p=!1,f=!1;e.addEventListener("click",async()=>{f=!f;const l=document.getElementById("cses-db-arrow");if(f){if(l&&(l.style.transform="rotate(180deg)"),n.style.gridTemplateRows="1fr",!p){p=!0,g.innerHTML=`
          <div style="padding:20px;text-align:center;color:#666;">
            Loading dashboard data...
          </div>`;const x=await P();g.innerHTML=x}}else l&&(l.style.transform="rotate(0deg)"),n.style.gridTemplateRows="0fr"})}function j(){E()}export{j as onExecute};
