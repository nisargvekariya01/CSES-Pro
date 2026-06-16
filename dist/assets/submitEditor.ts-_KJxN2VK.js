function _(){var k,E,C;if(!window.location.href.includes("/submit"))return;const s=document.querySelector('input[type="file"][name="file"]'),f=document.querySelector('form[enctype="multipart/form-data"]');if(!s||!f)return;const o=s.parentElement;if(!o)return;const b=()=>{const d=document.getElementById("styles-dark");d&&d.rel==="stylesheet"?document.body.classList.add("cses-is-dark"):document.body.classList.remove("cses-is-dark")};b(),new MutationObserver(b).observe(document.head,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["rel","disabled"]});const g=document.createElement("style");g.textContent=`
    select[name="lang"], 
    input[type="file"]::file-selector-button, 
    input[type="submit"] {
      background-color: rgba(128, 128, 128, 0.08) !important;
      color: inherit !important;
      border: 1px solid rgba(128, 128, 128, 0.3) !important;
      padding: 6px 12px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      font-family: inherit !important;
      outline: none !important;
      transition: background-color 0.2s, transform 0.1s;
    }
    select[name="lang"]:hover, 
    input[type="file"]::file-selector-button:hover, 
    input[type="submit"]:hover {
      background-color: rgba(128, 128, 128, 0.15) !important;
    }
    select[name="lang"]:active, 
    input[type="file"]::file-selector-button:active, 
    input[type="submit"]:active {
      transform: scale(0.97);
    }
    body.cses-is-dark select[name="lang"] option {
      background-color: #1e293b;
      color: #e2e8f0;
    }
    body:not(.cses-is-dark) select[name="lang"] option {
      background-color: #ffffff;
      color: #222222;
    }
  `,document.head.appendChild(g);const r=document.createElement("div");r.style.display="flex",r.style.gap="16px",r.style.marginTop="16px",r.style.marginBottom="8px";const n=document.createElement("input");n.type="radio",n.name="cses_submit_mode",n.id="mode_paste",n.checked=!0,n.style.cursor="pointer";const l=document.createElement("label");l.htmlFor="mode_paste",l.textContent="Paste code",l.style.cursor="pointer",l.style.fontWeight="bold";const i=document.createElement("input");i.type="radio",i.name="cses_submit_mode",i.id="mode_upload",i.style.cursor="pointer";const a=document.createElement("label");a.htmlFor="mode_upload",a.textContent="Upload file",a.style.cursor="pointer";const h=(d,p)=>{const t=document.createElement("div");return t.style.display="flex",t.style.alignItems="center",t.style.gap="4px",t.appendChild(d),t.appendChild(p),t};r.appendChild(h(n,l)),r.appendChild(h(i,a));const e=document.createElement("textarea");e.placeholder="Paste your code here...",e.style.width="100%",e.style.maxWidth="800px",e.style.minHeight="300px",e.style.fontFamily="monospace",e.style.fontSize="14px",e.style.padding="12px",e.style.border="1px solid rgba(128, 128, 128, 0.3)",e.style.borderRadius="4px",e.style.resize="vertical",e.style.backgroundColor="rgba(128, 128, 128, 0.05)",e.style.color="inherit";const c=document.createElement("div");c.style.marginTop="16px",c.style.marginBottom="16px",c.appendChild(e),(k=o.parentElement)==null||k.insertBefore(r,o);const y=document.querySelector('select[name="lang"]'),x=y==null?void 0:y.parentElement;x&&((E=o.parentElement)==null||E.insertBefore(x,o)),(C=o.parentElement)==null||C.insertBefore(c,o.nextSibling),s.style.display="none";const v=()=>{n.checked?(c.style.display="block",s.style.display="none",l.style.fontWeight="bold",a.style.fontWeight="normal"):(c.style.display="none",s.style.display="inline-block",l.style.fontWeight="normal",a.style.fontWeight="bold")};n.addEventListener("change",v),i.addEventListener("change",v),f.addEventListener("submit",d=>{if(n.checked){const p=e.value.trim();if(!p){d.preventDefault(),alert("Please paste some code before submitting!");return}const t=document.querySelector('select[name="lang"]'),u=(t==null?void 0:t.value.toLowerCase())||"";let m="txt";u.includes("c++")?m="cpp":u.includes("java")?m="java":u.includes("python")?m="py":u.includes("rust")&&(m="rs");const W=new File([p],`solution.${m}`,{type:"text/plain"}),w=new DataTransfer;w.items.add(W),s.files=w.files}})}function D(){_()}export{D as onExecute};
