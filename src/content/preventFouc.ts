// Runs at document_start to hide the native CSES layout before it paints, preventing a flash of unstyled content (FOUC).
const url = window.location.href;
if (/\/(task|submit|view|stats|statistics|analysis|result)\/\d+/.test(url)) {
  const style = document.createElement('style');
  style.id = 'cses-fouc-preventer';
  style.textContent = `
    .content-wrapper, .sidebar { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
  `;
  document.documentElement.appendChild(style);

  // Safety fallback: if the main script crashes, restore visibility after 2s
  setTimeout(() => {
    const s = document.getElementById('cses-fouc-preventer');
    if (s) s.remove();
  }, 2000);
}
