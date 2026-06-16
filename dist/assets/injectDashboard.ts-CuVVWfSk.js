import{c as u}from"./cses-problems-BDV4gcZH.js";import{e as y}from"./storage-DPB6uFbM.js";const C=["Introductory Problems","Sorting and Searching","Dynamic Programming","Graph Algorithms","Range Queries","Tree Algorithms","Mathematics","String Algorithms","Geometry","Advanced Techniques","Sliding Window Problems","Interactive Problems","Bitwise Operations","Construction Problems","Advanced Graph Problems","Counting Problems","Additional Problems I","Additional Problems II"];function m(n){return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`}function P(n){const d=u,i={};for(const[r,t]of Object.entries(d))i[t.category]||(i[t.category]=[]),i[t.category].push(r);return C.filter(r=>{var t;return(t=i[r])==null?void 0:t.length}).map(r=>{const t=i[r],e=t.filter(s=>n[s]).length;return{name:r,solved:e,total:t.length,pct:t.length?e/t.length*100:0}})}function v(){const n=document.getElementById("styles-dark");return(n==null?void 0:n.rel)==="stylesheet"}function z(n,d,i){const r=d>0?n/d:0,t=52,e=70,s=70,a=2*Math.PI*t,o=r*a,c=a-o,l="currentColor",g="rgba(128, 128, 128, 0.8)",p="rgba(128, 128, 128, 0.2)",h=r>0?`
    <circle cx="${e}" cy="${s}" r="${t}"
      fill="none" stroke="#22c55e" stroke-width="22"
      stroke-dasharray="${o.toFixed(2)} ${c.toFixed(2)}"
      transform="rotate(-90 ${e} ${s})"
      stroke-linecap="butt"/>`:"";return`
  <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
    ${`
  <svg width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0;display:block;margin:0 auto">
    <!-- Track -->
    <circle cx="${e}" cy="${s}" r="${t}" fill="none" stroke="${p}" stroke-width="22"/>
    <!-- Solved arc -->
    ${h}
    <!-- Center text: percentage -->
    <text x="${e}" y="${s-8}" text-anchor="middle" dominant-baseline="middle"
      font-size="20" font-weight="700" fill="${l}" font-family="inherit">
      ${(r*100).toFixed(1)}%
    </text>
    <text x="${e}" y="${s+14}" text-anchor="middle" dominant-baseline="middle"
      font-size="11" fill="${g}" font-family="inherit">
      ${n} / ${d}
    </text>
  </svg>`}
    <div style="display:flex;gap:16px;font-size:12px;color:${l};font-weight:500">
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:10px;height:10px;border-radius:50%;background:#22c55e"></div>
        Solved
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:10px;height:10px;border-radius:50%;background:${p};border:1px solid rgba(128,128,128,0.2)"></div>
        <span style="color:${g}">Unsolved</span>
      </div>
    </div>
  </div>`}function D(n){const d=Object.keys(n).filter(o=>(n[o]??0)>0).sort();if(!d.length)return{cur:0,best:0};const i=new Date;i.setHours(0,0,0,0);const r=m(i),t=m(new Date(i.getTime()-864e5));let e=0;if((n[r]??0)>0||(n[t]??0)>0){let o=(n[r]??0)>0?i:new Date(i.getTime()-864e5);for(e=1;;){const c=new Date(o.getTime()-864e5);if((n[m(c)]??0)>0)e++,o=c;else break}}let s=0,a=1;for(let o=1;o<d.length;o++)(new Date(d[o]).getTime()-new Date(d[o-1]).getTime())/864e5===1?a++:(s=Math.max(s,a),a=1);return s=Math.max(s,a,e),{cur:e,best:s}}async function w(){const n=await y(),{username:d,solvedProblems:i,heatmapData:r}=n;v();const t=Object.keys(u).length,e=Object.keys(i).length,s=t>0?e/t*100:0,{cur:a,best:o}=D(r),c=P(i),l="rgba(128, 128, 128, 0.2)",g="inherit",p="rgba(128, 128, 128, 0.8)",h="#22c55e",x=c.map(({name:$,solved:k,total:S,pct:f},I)=>{const b=f>=100?h:f>=50?"#2563eb":"#94a3b8";return`
      <tr style="border-bottom:1px solid ${l}">
        <td style="padding:8px 14px;font-size:14px;color:${g}">${$}</td>
        <td style="padding:8px 14px;text-align:right;font-size:13px;color:${p};white-space:nowrap">${k} / ${S}</td>
        <td style="padding:8px 14px;min-width:140px">
          <div style="background:${l};border-radius:999px;height:6px;overflow:hidden">
            <div style="width:${f.toFixed(1)}%;height:100%;background:${b};border-radius:999px"></div>
          </div>
        </td>
        <td style="padding:8px 14px;text-align:right;font-size:12px;font-weight:600;color:${b};white-space:nowrap;min-width:52px">${f.toFixed(1)}%</td>
      </tr>`}).join("");return`
<div id="cses-dashboard-panel" style="font-family:inherit">
<style>
  #cses-dashboard-panel .cses-db-section {
    margin-bottom: 24px;
  }
  #cses-dashboard-panel .cses-db-section-title {
    font-size:13px;font-weight:600;color:${p};text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px
  }
  #cses-dashboard-panel .cses-db-table { width:100%;border-collapse:collapse;border:1px solid ${l};border-radius:8px;overflow:hidden }
  #cses-dashboard-panel .cses-db-table thead tr { border-bottom: 2px solid ${l} }
  #cses-dashboard-panel .cses-db-table thead th { padding:8px 14px;text-align:left;font-size:11px;font-weight:700;color:${p};text-transform:uppercase;letter-spacing:.05em }
</style>

<!-- Title removed as it is now in the dropdown summary -->

<!-- Overall Progress (Pie chart + bar + streaks) -->
<div class="cses-db-section">
  <div class="cses-db-section-title">Overall Progress</div>
  <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap">

    <!-- Donut pie chart -->
    ${z(e,t)}

    <!-- Progress details + streaks -->
    <div style="flex:1;min-width:200px">
      <!-- Bar -->
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;font-weight:600;color:currentColor">${e} / ${t} problems</span>
          <span style="font-size:13px;font-weight:700;color:${h}">${s.toFixed(1)}%</span>
        </div>
        <div style="background:${l};border-radius:999px;height:10px;overflow:hidden">
          <div style="width:${s.toFixed(1)}%;height:100%;background:linear-gradient(90deg,#15803d,#22c55e,#4ade80);border-radius:999px;transition:width 0.6s"></div>
        </div>
      </div>

      <!-- Streaks inline -->
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 0;flex:1;min-width:120px">
          <span style="font-size:22px">🔥</span>
          <div>
            <div style="font-size:18px;font-weight:700;color:#f97316;font-family:monospace;line-height:1">${a}</div>
            <div style="font-size:10px;color:${p}">day streak</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:10px 0;flex:1;min-width:120px">
          <span style="font-size:22px">🏆</span>
          <div>
            <div style="font-size:18px;font-weight:700;color:#a855f7;font-family:monospace;line-height:1">${o}</div>
            <div style="font-size:10px;color:${p}">best streak</div>
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
  <tbody>${x}</tbody>
</table>

</div>`}async function T(){if(!(await y()).username)return;const d=document.querySelector(".content");if(!d||document.getElementById("cses-dashboard-wrapper")||!window.location.pathname.match(/\/(problemset|list)\/?$/))return;const r=document.createElement("div");r.id="cses-dashboard-wrapper",r.style.marginBottom="24px",v();const t="rgba(128, 128, 128, 0.2)",e=document.createElement("div");e.style.cursor="pointer",e.style.fontSize="16px",e.style.fontWeight="600",e.style.padding="14px 18px",e.style.backgroundColor="rgba(128, 128, 128, 0.08)",e.style.backdropFilter="blur(12px)",e.style.setProperty("-webkit-backdrop-filter","blur(12px)"),e.style.border=`1px solid ${t}`,e.style.borderRadius="8px",e.style.color="inherit",e.style.display="flex",e.style.alignItems="center",e.style.justifyContent="space-between",e.style.transition="background-color 0.2s",e.onmouseenter=()=>e.style.backgroundColor="rgba(128, 128, 128, 0.15)",e.onmouseleave=()=>e.style.backgroundColor="rgba(128, 128, 128, 0.08)",e.innerHTML=`
    <span style="display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">📊</span> 
      <span>Progress Dashboard</span>
    </span>
    <span id="cses-db-arrow" style="font-size:12px;opacity:0.6;transition:transform 0.4s ease">▼</span>
  `,r.appendChild(e);const s=document.createElement("div");s.style.display="grid",s.style.gridTemplateRows="0fr",s.style.transition="grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)";const a=document.createElement("div");a.style.overflow="hidden";const o=document.createElement("div");o.style.padding="24px 0 8px 0",a.appendChild(o),s.appendChild(a),r.appendChild(s),d.insertBefore(r,d.firstChild);let c=!1,l=!1;e.addEventListener("click",async()=>{l=!l;const g=document.getElementById("cses-db-arrow");if(l){if(g&&(g.style.transform="rotate(180deg)"),s.style.gridTemplateRows="1fr",!c){c=!0,o.innerHTML=`
          <div style="padding:20px;text-align:center;color:#666;">
            Loading dashboard data...
          </div>`;const p=await w();o.innerHTML=p}}else g&&(g.style.transform="rotate(0deg)"),s.style.gridTemplateRows="0fr"})}async function E(){var o;if(!(await y()).username||!window.location.pathname.startsWith("/user/"))return;const i=document.querySelector(".content");if(!i)return;const t=Array.from(i.querySelectorAll("h2")).find(c=>{var l;return(l=c.textContent)==null?void 0:l.includes("User information")});if(!t)return;const e=t.nextElementSibling;if(!e||e.tagName!=="TABLE"||document.getElementById("cses-user-dashboard-injected"))return;const s=await w(),a=document.createElement("div");a.id="cses-user-dashboard-injected",a.style.margin="32px 0",a.innerHTML=`
    <h2>Progress Dashboard</h2>
    ${s}
  `,(o=e.parentNode)==null||o.insertBefore(a,e.nextSibling)}function B(){T(),E()}export{B as onExecute,w as renderDashboard};
