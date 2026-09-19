import problemData from '../data/cses-problems.json';

// Global Search UI for CSES Pro (Ctrl+K or Cmd+K)
export function initGlobalSearch() {
  // Only run on the main problemset list pages
  const path = window.location.pathname;
  if (!path.match(/^\/problemset\/?(list\/?)?$/)) {
    return;
  }

  if (document.getElementById('cses-global-search-overlay')) return;

  function getIsDark() {
    try {
      const darkFlag = document.getElementById('darkmode-enabled');
      if (darkFlag) {
        return darkFlag.textContent?.trim() === 'true';
      }
    } catch (e) {}

    const darkSheet = document.getElementById('styles-dark') as HTMLLinkElement | null;
    if (darkSheet) {
      return darkSheet.rel === 'stylesheet' || !darkSheet.rel.includes('alternate');
    }

    return document.body.classList.contains('cses-theme-dark') || document.body.classList.contains('dark-theme');
  }

  // Flatten the problem JSON into an array for searching
  const problems = Object.entries(problemData).map(([id, info]) => ({
    id,
    title: (info as any).title,
    category: (info as any).category
  }));

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'cses-global-search-overlay';
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
    z-index: 10000;
    align-items: flex-start;
    justify-content: center;
    padding-top: 12vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `;

  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'cses-global-search-modal';
  modal.style.cssText = `
    width: 100%;
    max-width: 650px;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: background 0.2s, border-color 0.2s;
  `;
  
  // Create search input wrapper
  const inputWrapper = document.createElement('div');
  inputWrapper.style.cssText = `
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
  `;
  
  const searchIcon = document.createElement('i');
  searchIcon.className = 'fas fa-search';
  searchIcon.style.cssText = `
    font-size: 20px;
    color: #888;
  `;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search problems by name, ID, or category...';
  input.style.cssText = `
    width: 100%;
    font-size: 20px;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-weight: 400;
    transition: color 0.2s;
  `;
  
  inputWrapper.appendChild(searchIcon);
  inputWrapper.appendChild(input);
  
  // Create results list
  const resultsList = document.createElement('div');
  resultsList.id = 'cses-global-search-results';
  resultsList.className = 'cses-custom-scroll';
  resultsList.style.cssText = `
    max-height: 450px;
    overflow-y: auto;
    padding: 8px 0;
  `;

  modal.appendChild(inputWrapper);
  modal.appendChild(resultsList);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Inject custom scrollbar styles based on theme
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .cses-custom-scroll::-webkit-scrollbar {
      width: 8px;
    }
    .cses-custom-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .cses-custom-scroll::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    .cses-theme-dark-search .cses-custom-scroll::-webkit-scrollbar-thumb {
      background: #555;
    }
    .cses-custom-scroll::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    .cses-theme-dark-search .cses-custom-scroll::-webkit-scrollbar-thumb:hover {
      background: #777;
    }
    .cses-search-item {
      transition: background 0.1s;
    }
  `;
  document.head.appendChild(styleEl);

  const applyTheme = () => {
    const isDark = getIsDark();
    if (isDark) {
      modal.classList.add('cses-theme-dark-search');
      modal.style.background = '#252526';
      modal.style.border = '1px solid #444';
      inputWrapper.style.borderBottom = '1px solid #3c3c3c';
      input.style.color = '#e4e4e4';
    } else {
      modal.classList.remove('cses-theme-dark-search');
      modal.style.background = '#ffffff';
      modal.style.border = '1px solid #e0e0e0';
      inputWrapper.style.borderBottom = '1px solid #eee';
      input.style.color = '#111';
    }
    
    // Rerender items to update text colors
    renderResults(currentResults);
  };

  document.addEventListener('theme-changed', applyTheme);

  let selectedIndex = 0;
  let currentResults: typeof problems = [];

  const closeSearch = () => {
    overlay.style.display = 'none';
    input.value = '';
    input.blur();
  };

  const openSearch = () => {
    applyTheme();
    overlay.style.display = 'flex';
    input.value = '';
    renderResults(problems);
    input.focus();
  };

  const renderResults = (results: typeof problems) => {
    const isDark = getIsDark();
    currentResults = results.slice(0, 50); // limit to 50
    resultsList.innerHTML = '';
    
    if (selectedIndex >= currentResults.length) selectedIndex = 0;

    if (currentResults.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No matching problems found';
      empty.style.cssText = 'padding: 24px; color: #888; text-align: center; font-size: 15px;';
      resultsList.appendChild(empty);
      return;
    }

    currentResults.forEach((p, index) => {
      const item = document.createElement('div');
      item.className = 'cses-search-item';
      item.style.cssText = `
        padding: 12px 24px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-left: 3px solid transparent;
        ${index === selectedIndex ? 'background: rgba(59, 130, 246, 0.15); border-left-color: #3b82f6;' : ''}
      `;
      
      const titleWrap = document.createElement('div');
      const title = document.createElement('div');
      title.textContent = p.title;
      title.style.cssText = `font-weight: 600; color: ${isDark ? '#e4e4e4' : '#222'}; font-size: 15px;`;
      
      const cat = document.createElement('div');
      cat.textContent = p.category;
      cat.style.cssText = `font-size: 13px; color: #888; margin-top: 4px;`;
      
      titleWrap.appendChild(title);
      titleWrap.appendChild(cat);
      
      const idLabel = document.createElement('div');
      idLabel.textContent = '#' + p.id;
      idLabel.style.cssText = `
        font-size: 13px;
        color: ${isDark ? '#aaa' : '#666'};
        font-family: monospace;
        background: ${isDark ? '#333' : '#f0f0f0'};
        padding: 4px 8px;
        border-radius: 4px;
      `;

      item.appendChild(titleWrap);
      item.appendChild(idLabel);

      item.addEventListener('mouseenter', () => {
        updateSelection(index);
      });

      item.addEventListener('click', () => {
        window.location.href = `/problemset/task/${p.id}`;
      });

      resultsList.appendChild(item);
    });
  };

  const updateSelection = (index: number) => {
    const isDark = getIsDark();
    const items = resultsList.querySelectorAll('.cses-search-item');
    if (items[selectedIndex]) {
      const el = items[selectedIndex] as HTMLElement;
      el.style.background = 'transparent';
      el.style.borderLeftColor = 'transparent';
    }
    selectedIndex = index;
    if (items[selectedIndex]) {
      const el = items[selectedIndex] as HTMLElement;
      el.style.background = 'rgba(59, 130, 246, 0.15)';
      el.style.borderLeftColor = '#3b82f6';
      
      // Auto-scroll logic
      const scrollParent = resultsList;
      const elementTop = el.offsetTop;
      const elementBottom = elementTop + el.offsetHeight;
      const parentTop = scrollParent.scrollTop;
      const parentBottom = parentTop + scrollParent.offsetHeight;

      if (elementBottom > parentBottom) {
        scrollParent.scrollTop = elementBottom - scrollParent.offsetHeight;
      } else if (elementTop < parentTop) {
        scrollParent.scrollTop = elementTop;
      }
    }
  };

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    if (!query) {
      selectedIndex = 0;
      renderResults(problems);
      return;
    }
    const filtered = problems.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.id.includes(query) || 
      p.category.toLowerCase().includes(query)
    );
    selectedIndex = 0;
    renderResults(filtered);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedIndex < currentResults.length - 1) updateSelection(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedIndex > 0) updateSelection(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentResults[selectedIndex]) {
        window.location.href = `/problemset/task/${currentResults[selectedIndex].id}`;
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  // Global hotkey
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (overlay.style.display === 'none') {
        openSearch();
      } else {
        closeSearch();
      }
    }
  });

  // Inject a visible button into the header
  const headerControls = document.querySelector('.header .controls');
  if (headerControls && !document.getElementById('cses-search-btn-nav')) {
    const searchBtn = document.createElement('a');
    searchBtn.id = 'cses-search-btn-nav';
    searchBtn.href = '#';
    searchBtn.innerHTML = '<i class="fas fa-search"></i> Search (Cmd+K)';
    searchBtn.style.cssText = 'cursor: pointer; margin-right: 15px; font-weight: 500;';
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    });
    headerControls.prepend(searchBtn);
  }
}

// Init on load
initGlobalSearch();
