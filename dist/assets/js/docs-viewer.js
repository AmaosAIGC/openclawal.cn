/**
 * OpenClaw 文档查看器 v4.2
 * 修复：点击顶部 Tab 时左侧目录只显示该版块内容
 */
(function() {
  var currentPath = '/docs/start/showcase/';
  var sidebarData = null;
  var articles = null;
  var isLoading = false;
  var currentSection = 'start';

  function injectCSS() {
    if (document.getElementById('oc-docs-css')) return;
    var link = document.createElement('link');
    link.id = 'oc-docs-css';
    link.rel = 'stylesheet';
    link.href = '/assets/docs-site.css?v=2';
    document.head.appendChild(link);
    var style = document.createElement('style');
    style.id = 'oc-docs-body-fix';
    style.textContent = ':root{--bg:#111!important}#oc-docs-viewer{--bg:#041c1c;--paper:#082626;--paper-2:#0a3030;--ink:#ffe6cb;--text:rgba(255,230,203,.84);--muted:rgba(255,230,203,.5);--line:rgba(255,230,203,.28);--line-strong:rgba(255,230,203,.4);--brand:#ffd700;--green:#5eead4;background:transparent}#oc-docs-viewer pre{background:rgba(8,38,38,.4)!important}#oc-docs-viewer figure figcaption button[data-code-copy]{display:none!important}#oc-docs-viewer .oc-copy-btn svg{display:block}#oc-docs-viewer .tabs{position:sticky;top:52px;z-index:60;display:flex;align-items:center}#oc-docs-viewer .tab-source-badge{margin-left:auto;font-size:12px;opacity:0.45;color:var(--muted);white-space:nowrap;padding-right:24px;user-select:none;flex-shrink:0}#oc-docs-viewer .tab-link{font-size:16px;font-weight:600}#oc-docs-viewer #ocs-sidebar h2{font-size:15px;font-weight:600}#oc-docs-viewer #ocs-toc h2{font-size:14.5px;font-weight:600}#oc-docs-viewer .nav-link{font-size:16px;font-weight:600}#oc-docs-viewer #ocs-toc-links a{font-size:15.5px;font-weight:600}#oc-docs-viewer .tab-source-badge{font-size:14px!important}#oc-docs-viewer #ocs-content p{font-size:16.2px}#oc-docs-viewer #ocs-content li,#oc-docs-viewer #ocs-content dt,#oc-docs-viewer #ocs-content dd,#oc-docs-viewer #ocs-content th,#oc-docs-viewer #ocs-content td,#oc-docs-viewer #ocs-content summary,#oc-docs-viewer #ocs-content blockquote{font-size:16px}#oc-docs-viewer #ocs-content h1{font-size:calc(2.2rem + 3.2px)}#oc-docs-viewer #ocs-content h2{font-size:calc(1.6rem + 3.2px)}#oc-docs-viewer #ocs-toc{border-left:1px solid rgba(245,230,204,.35);padding-left:24px}';
    document.head.appendChild(style);
  }

  function injectViewer() {
    if (document.getElementById('oc-docs-viewer')) return;
    injectCSS();
    var viewer = document.createElement('div');
    viewer.id = 'oc-docs-viewer';
    viewer.style.display = 'none';
    viewer.innerHTML =
      '<nav class="tabs" id="ocs-tabs" style="border-bottom:1px solid var(--line);padding-left:56px;background:var(--bg)">' +
          '<a class="tab-link" data-section="start" href="#">快速开始</a>' +
          '<a class="tab-link" data-section="install" href="#">安装</a>' +
          '<a class="tab-link" data-section="channels" href="#">消息渠道</a>' +
          '<a class="tab-link" data-section="concepts" href="#">代理</a>' +
          '<a class="tab-link" data-section="tools" href="#">工具</a>' +
          '<a class="tab-link" data-section="providers" href="#">模型</a>' +
          '<a class="tab-link" data-section="platforms" href="#">平台</a>' +
          '<a class="tab-link" data-section="gateway" href="#">网关与运维</a>' +
          '<a class="tab-link" data-section="cli" href="#">参考</a>' +
          '<a class="tab-link" data-section="help" href="#">帮助</a>' +
                    '<span class="tab-source-badge">原文来源：docs.openclaw.ai · 本站持续更新原创内容</span>' +
                    '<span class="tab-underline" aria-hidden="true"></span>' +
        '</nav>' +
      '</header>' +
      '<div class="doc-shell">' +
        '<aside class="sidebar" id="ocs-sidebar-wrap"><nav id="ocs-sidebar"></nav></aside>' +
        '<main class="main" id="ocs-main">' +
          '<article class="article">' +
            '<div class="article-meta-row">' +
              '<nav class="breadcrumbs" id="ocs-breadcrumbs" aria-label="Breadcrumb"></nav>' +
              '<div class="page-tools"><div class="page-actions">' +
                '<button type="button" class="page-actions-primary" id="ocs-copy-page"><svg class="icon icon-copy" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>复制页面</span></button>' +
              '</div></div>' +
            '</div>' +
            '<div id="ocs-content"></div>' +
          '</article>' +
          '<aside class="toc" id="ocs-toc"><h2>本页内容</h2><nav id="ocs-toc-links"></nav></aside>' +
        '</main>' +
      '</div>';
    var navEl = document.querySelector('.navbar') || document.querySelector('nav');
    (navEl ? navEl.parentNode : document.body).insertBefore(viewer, navEl ? navEl.nextSibling : null);
  }

  function loadData(cb) {
    if (sidebarData && articles) { cb(); return; }
    var n = 0;
    function done() { n++; if (n >= 2 && sidebarData && articles) cb(); }
    var x1 = new XMLHttpRequest();
    x1.open('GET', '/docs-config.json?t=' + Date.now(), true);
    x1.onload = function() { try { sidebarData = JSON.parse(x1.responseText); } catch(e) {} done(); };
    x1.onerror = function() { done(); };
    x1.send();
    var x2 = new XMLHttpRequest();
    x2.open('GET', '/docs-articles.json?t=' + Date.now(), true);
    x2.onload = function() { try { articles = JSON.parse(x2.responseText); } catch(e) {} done(); };
    x2.onerror = function() { done(); };
    x2.send();
  }

  function getSectionFromPath(path) {
    var parts = path.replace('/docs/', '').split('/').filter(Boolean);
    return parts[0] || 'start';
  }

  function showDocs(path) {
    currentPath = normalizePath(path || '/docs/start/showcase/');
    currentSection = hrefToSection(currentPath);
    injectViewer();
    injectCSS(); // ensure CSS is always loaded
    var v = document.getElementById('oc-docs-viewer');
    if (!v) return;
    v.style.display = '';
    addDocsMobileNav();
    var main = document.querySelector('.oc-page') || document.querySelector('.main-wrapper') || document.querySelector('#__docusaurus_skipToContent_fallback');
    if (main) main.style.display = 'none';
    document.querySelectorAll('.navbar__link').forEach(function(el) {
      el.classList.remove('navbar__link--active');
      if (el.textContent.trim() === '文档') el.classList.add('navbar__link--active');
    });
    window.scrollTo(0, 0);
    loadData(function() { updateTabs(); renderSidebar(); loadContent(currentPath); });
  }

  function hideDocs() {
    var viewer = document.getElementById('oc-docs-viewer');
    if (viewer) viewer.style.display = 'none';
    ['oc-skills-frame','oc-practice-frame'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    var main = document.querySelector('.oc-page') || document.querySelector('.main-wrapper') || document.querySelector('#__docusaurus_skipToContent_fallback');
    if (main) main.style.display = '';
    var b = document.querySelector('.theme-announcement-bar');
    if (b) b.style.display = '';
  }

  function updateTabs() {
    var tabs = document.getElementById('ocs-tabs');
    if (!tabs) return;
    tabs.querySelectorAll('[data-section]').forEach(function(el) {
      var sec = el.getAttribute('data-section');
      el.classList.toggle('active', sec === currentSection);
      el.onclick = function(e) {
        e.preventDefault();
        currentSection = sec;
        updateTabs();
        renderSidebar();
        var found = findFirstInSection(sec);
        if (found) navigateTo(found);
      };
    });
    tabs.classList.add('is-ready');
    var active = tabs.querySelector('.tab-link.active');
    var underline = tabs.querySelector('.tab-underline');
    if (active && underline) {
      underline.style.setProperty('--tu-x', active.offsetLeft + 'px');
      underline.style.setProperty('--tu-w', active.offsetWidth + 'px');
    }
  }

  function findFirstInSection(sec) {
    function findInItems(items) {
      for (var i = 0; i < (items || []).length; i++) {
        var it = items[i];
        if (it.href && it.href.indexOf('/docs/' + sec + '/') === 0) return it.href;
        if (it.items) {
          var found = findInItems(it.items);
          if (found) return found;
        }
      }
    }
    for (var i = 0; i < (sidebarData || []).length; i++) {
      var item = sidebarData[i];
      if (item.type === 'category') {
        var found = findInItems(item.items);
        if (found) return found;
      }
    }
    return '/docs/' + sec + '/';
  }

  function renderSidebar() {
    var root = document.getElementById('ocs-sidebar');
    if (!root || !sidebarData) return;
    var tabNames = { 'start':'快速开始','install':'安装','channels':'消息渠道','concepts':'代理','tools':'工具',
      'providers':'模型','platforms':'平台','gateway':'网关与运维','cli':'参考','help':'帮助' };
    var targetLabel = tabNames[currentSection] || '';
    var found = null;
    for (var i = 0; i < sidebarData.length; i++) {
      if (sidebarData[i].type === 'category' && sidebarData[i].label === targetLabel) {
        found = sidebarData[i].items;
        break;
      }
    }
    if (!found) found = [];
    root.innerHTML = buildSidebar([{ type: 'category', label: targetLabel, items: found }]);
    root.querySelectorAll('[data-href]').forEach(function(el) {
      el.onclick = function(e) { e.preventDefault(); navigateTo(this.getAttribute('data-href')); };
    });
  }

  var sectionPathMap = {
    'install/node': 'help',
    'vps': 'install',
    'automation': 'tools',
    'brave-search': 'tools',
    'perplexity': 'tools',
    'date-time': 'reference',
    'logging': 'gateway',
    'network': 'gateway',
    'prose': 'reference',
    'tts': 'tools',
    'clawhub': 'reference',
    'nodes': 'help',
    'security': 'gateway',
    'web': 'gateway',
  };

  function hrefToSection(href) {
    for (var key in sectionPathMap) {
      if (href.indexOf('/docs/' + key + '/') === 0) {
        return sectionPathMap[key];
      }
    }
    var m = href.match(/\/docs\/([^\/]+)\//);
    if (m) {
      var pathSection = m[1];
      return sectionPathMap[pathSection] || pathSection;
    }
    return '';
  }

  function filterItemsBySection(items, section) {
    if (!items) return [];
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.type === 'link' && it.href) {
        var itemSection = hrefToSection(it.href);
        if (itemSection === section) {
          result.push(it);
        }
      } else if (it.type === 'category' || it.type === 'subcategory') {
        var sub = filterItemsBySection(it.items, section);
        if (sub.length > 0) {
          result.push({ type: 'category', label: it.label, items: sub });
        }
      }
    }
    return result;
  }

    function buildSidebar(items) {
    var h = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.type === 'category' && it.items) {
        for (var j = 0; j < it.items.length; j++) {
          var sub = it.items[j];
          h += '<section class="nav-section">' +
            '<h2>' + esc(sub.label) + '</h2>';
          if (sub.items) {
            for (var k = 0; k < sub.items.length; k++) {
              var link = sub.items[k];
              if (link.type === 'link') {
                var active = link.href === currentPath;
                h += '<a class="nav-link' + (active ? ' active' : '') + '" href="#" data-href="' + link.href + '">' + esc(link.label) + '</a>';
              }
            }
          }
          h += '</section>';
        }
      } else if (it.type === 'link') {
        var active = it.href === currentPath;
        h += '<section class="nav-section"><a class="nav-link' + (active ? ' active' : '') + '" href="#" data-href="' + it.href + '">' + esc(it.label) + '</a></section>';
      }
    }
    return h;
  }


  function hasActiveInCategory(items) {
    if (!items) return false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].href === currentPath) return true;
      if ((items[i].type === 'category' || items[i].type === 'subcategory') && hasActiveInCategory(items[i].items)) return true;
    }
    return false;
  }

  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  function updateBreadcrumbs(title) {
    var el = document.getElementById('ocs-breadcrumbs');
    if (!el) return;
    var parts = currentPath.replace('/docs/', '').split('/').filter(Boolean);
    if (parts.length === 0) { el.innerHTML = ''; return; }
    var tabNames = {'start':'快速开始','install':'安装','channels':'消息渠道','concepts':'核心概念','tools':'工具',
      'providers':'模型','platforms':'平台','gateway':'网关与运维','cli':'参考','help':'帮助'};
    var tabName = tabNames[parts[0]] || parts[0];
    el.innerHTML = '<span class="breadcrumb-part breadcrumb-tab"><a href="#">' + esc(tabName) + '</a></span>' +
      '<span class="breadcrumb-part breadcrumb-page"><span class="breadcrumb-separator" aria-hidden="true">/</span><span aria-current="page">' + esc(title) + '</span></span>';
  }

  function normalizePath(p) { return p.endsWith('/') ? p : p + '/'; }

  function navigateTo(path) {
    path = normalizePath(path);
    if (isLoading || path === currentPath) return;
    currentPath = path;
    isLoading = true;
    window.scrollTo(0, 0);
    updateTabs();
    renderSidebar();
    loadContent(path);
    var hashPath = path.replace('/docs/', '');
    if (window.location.hash !== '#docs/' + hashPath) {
      history.replaceState(null, '', '/#docs/' + hashPath);
    }
  }

  // Convert VitePress CardGroup/Card custom components to standard HTML
  // JSON content now has real HTML tags like <CardGroup cols={3}>
  function convertCards(html) {
    // CardGroup: cols={N} → div with grid class
    html = html.replace(/<CardGroup\s+cols=\{(\d+)\}>/g, '<div class="oc-card-grid oc-card-cols-$1">');
    html = html.replace(/<\/CardGroup>/g, '</div>');
    // Cards: extract title, href, icon, inner content → link card
    html = html.replace(/<Card\s+([^>]*)>([\s\S]*?)<\/Card>/g, function(m, attrs, inner) {
      var title = (attrs.match(/title="([^"]*)"/) || [])[1] || '';
      var href = (attrs.match(/href="([^"]*)"/) || [])[1] || '';
      var icon = (attrs.match(/icon="([^"]*)"/) || [])[1] || '';
      var iconHtml = icon ? '<span class="oc-card-icon">' + icon + '</span>' : '';
      return '<a class="oc-card" href="' + href + '">' + iconHtml + '<strong>' + title + '</strong>' + (inner.trim() ? '<span class="oc-card-desc">' + inner.trim() + '</span>' : '') + '</a>';
    });
    return html;
  }

  function loadContent(path) {
    var el = document.getElementById('ocs-content');
    if (!el) return;
    if (articles && articles[path]) {
      var a = articles[path];
      // STEP 0: Extract CardGroup data from data-page-markdown JSON (before cleanup)
      // This preserves the original descriptions that get lost when header is stripped
      var convertedCardGrid = '';
      var scm = a.content.match(/<script[^>]*data-page-markdown[^>]*>([\s\S]*?)<\/script>/);
      console.log('[CARD] scm found:', !!scm);
      if (scm) {
        console.log('[CARD] script inner preview:', scm[1].substring(0, 100));
        try {
          // Escape literal newlines in the JSON string before parsing
          var jsonStr = scm[1].replace(/\n/g,"\\n").replace(/\r/g,"\\r");
          var mdText = JSON.parse(jsonStr);

          console.log('[CARD] parsed mdText length:', mdText.length);
          console.log('[CARD] mdText contains CardGroup:', mdText.indexOf('<CardGroup'));
          // Handle one or more CardGroup blocks in the markdown text
          var cgRe = /<CardGroup\s+cols=\{(\d+)\}>([\s\S]*?)<\/CardGroup>/g;
          var cgm;
          var matchCount = 0;
          while ((cgm = cgRe.exec(mdText)) !== null) {
            matchCount++;
            console.log('[CARD] CardGroup match', matchCount, 'cols:', cgm[1]);
            var cardGroupHtml = '<CardGroup cols={' + cgm[1] + '}>' + cgm[2] + '</CardGroup>';
            convertedCardGrid += convertCards(cardGroupHtml);
          }
          console.log('[CARD] total CardGroup matches:', matchCount);
          console.log('[CARD] convertedCardGrid:', convertedCardGrid.substring(0, 200));
        } catch(e) { console.log('[CARD] parse error:', e); }
      }
      // Remove breadcrumbs/page-tools at top
      var contentHtml = a.content.replace(/<header class="article-header">/, '')
        .replace(/<\/header>/, '')
        .replace(/<div class="article-meta-row">[\s\S]*?<\/div>/, '')
        .replace(/<div class="page-tools"[\s\S]*?<\/div>/, '');
      // Strip the data-page-markdown script tag (its JSON-escaped content
      // confuses innerHTML parsing)
      contentHtml = contentHtml.replace(/<script type="application\/json" data-page-markdown[^>]*>[\s\S]*?<\/script>/, '');
      contentHtml = contentHtml.replace(/<\/details><\/div><\/div><\/div>/g, '');
      contentHtml = contentHtml.replace(/href="\/zh-CN\/([^"]+)"/g, 'href="/#docs/$1/"');
      // Convert/repair card groups
      // The real HTML has OLD format: <a class="oc-card" href="..."><div><strong>Title</strong>
      // No description, no </a> or </div> closing. Fix it.
      contentHtml = contentHtml.replace(/<a class="oc-card" href="([^"]*)"><div><strong>([^<]+)<\/strong>/g,
        '<a class="oc-card" href="$1"><strong>$2</strong></a>');
      contentHtml = contentHtml.replace(/<a class="oc-card" href="([^"]*)"><strong>([^<]+)<\/strong>\n/g,
        '<a class="oc-card" href="$1"><strong>$2</strong></a>\n');
      // Replace old format card grid with properly converted cards (with descriptions)
      if (convertedCardGrid) {
        convertedCardGrid = convertedCardGrid.replace(/href="\/zh-CN\//g, 'href="/#docs/');
        contentHtml = contentHtml.replace(/<div class="oc-card-grid[^>]*>[\s\S]*?<\/div>/, convertedCardGrid);
      }
      // Keep convertCards as fallback for pages with raw CardGroup tags
      contentHtml = convertCards(contentHtml);
      console.log('[DEBUG] contentHtml length:', contentHtml.length);
      console.log('[DEBUG] contentHtml contains card-grid:', contentHtml.includes('oc-card-grid'));
      console.log('[DEBUG] contentHtml preview (index 0-500):', contentHtml.substring(0, 500));
      console.log('[DEBUG] contentHtml cards area:', contentHtml.substring(contentHtml.indexOf('oc-card'), contentHtml.indexOf('oc-card') + 500) + '...');
      setTimeout(function() {
        // Use a temp container to avoid browser HTML parser eating custom elements
        var tmp = document.createElement('div');
        tmp.innerHTML = contentHtml;
        el.innerHTML = '';
        while (tmp.firstChild) { el.appendChild(tmp.firstChild); }
        updateBreadcrumbs(a.title || '');
        addCopyButtons();
        bindCopyPage();
        buildTOC();
        refreshMobileNav();
        isLoading = false;
        // Debug: check DOM after render
        setTimeout(function() {
          var cards = document.querySelectorAll('.oc-card');
          var empty = 0;
          cards.forEach(function(c) { if (!c.textContent.trim()) empty++; });
          console.log('[DEBUG] After render: ' + cards.length + ' cards, ' + empty + ' empty');
        }, 100);
      }, 50);
    } else {
      el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)"><p>加载中...</p></div>';
      setTimeout(function() {
        if (articles && articles[path]) { loadContent(path); return; }
        el.innerHTML = '<div style="padding:40px;text-align:center"><h2 style="color:var(--ink)">页面未找到</h2><p style="color:var(--muted)">请从侧边栏选择其他页面</p></div>';
        isLoading = false;
      }, 800);
    }
  }

  function buildTOC() {
    var tocNav = document.getElementById('ocs-toc-links');
    var tocWrap = document.getElementById('ocs-toc');
    if (!tocNav) return;
    var headings = document.querySelectorAll('#ocs-content h2');
    if (!headings.length) { tocWrap.style.display = 'none'; return; }
    tocWrap.style.display = '';
    var h = '';
    headings.forEach(function(h2, i) {
      var id = 'ocs-h2-' + i;
      h2.id = id;
      h2.style.scrollMarginTop = '120px';
      var text = h2.textContent.replace(/Copy link to section.*/, '').trim();
      if (!text) return;
      h += '<a href="#' + id + '" onclick="document.getElementById(\'' + id + '\').scrollIntoView({behavior:\'smooth\',block:\'start\'});return false">' + esc(text) + '</a>';
    });
    tocNav.innerHTML = h;
  }

  function addCopyButtons() {
    document.querySelectorAll('#ocs-content figure').forEach(function(fig) {
      var pre = fig.querySelector('pre');
      var fc = fig.querySelector('figcaption');
      if (!pre || !fc || fc.querySelector('.oc-copy-btn')) return;
      var orig = fc.querySelector('button[data-code-copy]');
      if (orig) orig.remove();
      var btn = document.createElement('button');
      btn.className = 'oc-copy-btn';
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      btn.style.cssText = 'margin-left:auto;background:transparent;color:var(--code-text,#eee7e2);border:1px solid rgba(255,230,203,.3);border-radius:4px;padding:4px;cursor:pointer;line-height:0;display:flex;align-items:center;justify-content:center';
      btn.onclick = function(e) {
        e.stopPropagation();
        var code = pre.querySelector('code');
        var text = code ? code.textContent : pre.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function() {
            btn.style.background = '#1a3a2a'; btn.style.borderColor = '#2d6a4f';
            setTimeout(function() { btn.style.background = 'transparent'; btn.style.borderColor = 'rgba(255,230,203,.3)'; }, 1500);
          }).catch(function() { fallbackCopy(text, btn); });
        } else { fallbackCopy(text, btn); }
      };
      fc.appendChild(btn);
    });
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy');
      btn.style.background = '#1a3a2a'; btn.style.borderColor = '#2d6a4f';
      btn.style.color = '#5eead4';
      setTimeout(function() { btn.style.background = 'transparent'; btn.style.borderColor = 'rgba(255,230,203,.3)'; btn.style.color = 'var(--code-text,#eee7e2)'; }, 1500);
    } catch(e) {}
    document.body.removeChild(ta);
  }

  function bindCopyPage() {
    var btn = document.getElementById('ocs-copy-page');
    if (!btn) return;
    btn.onclick = function(e) {
      e.preventDefault();
      var content = document.getElementById('ocs-content');
      if (!content) return;
      var text = content.innerText || content.textContent || '';
      text = text.replace(/Was this useful\?[\s\S]*/i, '').trim();
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          btn.innerHTML = '<svg class="icon icon-copy" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>已复制!</span>';
          btn.style.background = '#1a3a2a'; btn.style.borderColor = '#2d6a4f';
          setTimeout(function() {
            btn.innerHTML = '<svg class="icon icon-copy" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>复制页面</span>';
            btn.style.background = ''; btn.style.borderColor = '';
          }, 1500);
        }).catch(function() { fallbackCopyPage(text, btn); });
      } else { fallbackCopyPage(text, btn); }
    };
  }

  function fallbackCopyPage(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy');
      btn.innerHTML = '<svg class="icon icon-copy" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>已复制!</span>';
      btn.style.background = '#1a3a2a'; btn.style.borderColor = '#2d6a4f';
      setTimeout(function() {
        btn.innerHTML = '<svg class="icon icon-copy" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>复制页面</span>';
        btn.style.background = ''; btn.style.borderColor = '';
      }, 1500);
    } catch(e) {}
    document.body.removeChild(ta);
  }

  window.ocToggleSection = function(h2) {
    var next = h2.nextElementSibling;
    if (!next) return;
    var arrow = h2.querySelector('span');
    if (next.style.display === 'none') {
      next.style.display = ''; if (arrow) arrow.style.transform = 'rotate(90deg)';
    } else {
      next.style.display = 'none'; if (arrow) arrow.style.transform = '';
    }
  };

  function onHashChange() {
    var hash = window.location.hash;
    if (hash === '#docs' || hash === '#docs/') { showDocs('/docs/start/showcase/'); }
    else if (hash.startsWith('#docs/')) { showDocs('/' + hash.substring(1)); }
    else if (hash === '#skills' || hash === '#skills/') { loadSection('skills'); }
    else { hideDocs(); }
  }

  function loadSection(type) {
    var sf = document.getElementById('oc-' + type + '-frame');
    if (!sf) {
      sf = document.createElement('div'); sf.id = 'oc-' + type + '-frame';
      sf.style.cssText = 'display:none;position:relative;z-index:10;';
      var nav = document.querySelector('.navbar') || document.querySelector('nav');
      (nav ? nav.parentNode : document.body).insertBefore(sf, nav ? nav.nextSibling : null);
    }
    sf.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--muted)">加载中...</div>';
    sf.style.display = '';
    var m = document.querySelector('.oc-page') || document.querySelector('.main-wrapper');
    if (m) m.style.display = 'none';
    var label = type === 'skills' ? '技能' : '生态';
    document.querySelectorAll('.navbar__link').forEach(function(el) {
      el.classList.remove('navbar__link--active');
      if (el.textContent.trim() === label) el.classList.add('navbar__link--active');
    });
    window.scrollTo(0, 0);
    fetch('/' + type + '/index.html?' + Date.now()).then(function(r) { return r.text(); }).then(function(html) {
      var d = document.createElement('div'); d.innerHTML = html;
      var c = d.querySelector('main') || d.querySelector('.oc-page');
      if (c) {
        var styles = d.querySelectorAll('style');
        var styleHTML = '';
        styles.forEach(function(s) { styleHTML += s.outerHTML; });
        sf.innerHTML = styleHTML + c.outerHTML;
      }
    }).catch(function() { sf.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--muted)">加载失败</div>'; });
  }

  function refreshMobileNav() {
    var sbPanel = document.getElementById('oc-mobile-sidebar-panel');
    var tocPanel = document.getElementById('oc-mobile-toc-panel');
    if (!sbPanel && !tocPanel) return;
    var sb = document.getElementById('ocs-sidebar');
    if (sb && sbPanel) {
      sbPanel.innerHTML = sb.innerHTML;
      sbPanel.querySelectorAll('[data-href]').forEach(function(el) {
        el.onclick = function(e) { e.preventDefault(); closeNavPanel(); navigateTo(this.getAttribute('data-href')); };
      });
    }
    var tc = document.getElementById('ocs-toc-links');
    if (tc && tocPanel) {
      tocPanel.innerHTML = tc.innerHTML;
      tocPanel.querySelectorAll('a').forEach(function(a) {
        var href = a.getAttribute('href');
        if (href && href.indexOf('#ocs-h2-') === 0) {
          a.onclick = function(e) {
            e.preventDefault(); closeNavPanel();
            var target = document.getElementById(href.substring(1));
            if (target) target.scrollIntoView({behavior:'smooth',block:'start'});
          };
        }
      });
    }
  }

  function closeNavPanel() {
    var p = document.getElementById('oc-docs-mobile-panel');
    var b = document.getElementById('oc-docs-mobile-backdrop');
    if (p) p.style.left = '-100%';
    if (b) b.style.display = 'none';
    document.body.style.overflow = '';
  }

  function addDocsMobileNav() {
    var viewer = document.getElementById('oc-docs-viewer');
    if (!viewer || viewer.style.display === 'none') return;
    var ms = document.getElementById('oc-docs-mobile-css');
    if (!ms) {
      ms = document.createElement('style');
      ms.id = 'oc-docs-mobile-css';
      ms.textContent = '@media(max-width:996px){#oc-docs-viewer .sidebar{display:none!important}#oc-docs-viewer .toc{display:none!important}#oc-docs-viewer .main{grid-template-columns:1fr!important;width:100%!important}#oc-docs-viewer .doc-shell{grid-template-columns:1fr!important;gap:0}}';
      document.head.appendChild(ms);
    }
    if (window.innerWidth > 996 || document.getElementById('oc-docs-mobile-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'oc-docs-mobile-btn';
    btn.setAttribute('aria-label','文档导航菜单');
    btn.innerHTML = '本<br>章<br>目<br>录';
    btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9998;width:52px;min-height:80px;border-radius:8px;background:#ffd700;border:none;color:#041c1c;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:transform .15s;font-size:13px;font-weight:700;line-height:1.4;padding:8px 4px;text-align:center;';
    var back = document.createElement('div');
    back.id = 'oc-docs-mobile-backdrop';
    back.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9995;background:rgba(0,0,0,.55);display:none;';
    var panel = document.createElement('div');
    panel.id = 'oc-docs-mobile-panel';
    panel.style.cssText = 'position:fixed;top:0;left:-100%;z-index:9997;width:85vw;max-width:340px;height:100%;background:#0a2828;transition:left .25s cubic-bezier(.4,0,.2,1);overflow-y:auto;box-shadow:4px 0 24px rgba(0,0,0,.5);display:flex;flex-direction:column;';
    var tb = document.createElement('div');
    tb.style.cssText = 'display:flex;border-bottom:1px solid rgba(255,230,203,.15);flex-shrink:0;';
    var dt = document.createElement('button');
    dt.textContent = '文档目录'; dt.dataset.panel='sidebar';
    dt.style.cssText = 'flex:1;padding:14px 8px;font-size:15px;font-weight:600;background:transparent;border:none;color:#ffe6cb;cursor:pointer;border-bottom:2px solid #ffd700;';
    var tt = document.createElement('button');
    tt.textContent = '本页大纲'; tt.dataset.panel='toc';
    tt.style.cssText = 'flex:1;padding:14px 8px;font-size:15px;font-weight:600;background:transparent;border:none;color:rgba(255,230,203,.5);cursor:pointer;border-bottom:2px solid transparent;';
    tb.appendChild(dt); tb.appendChild(tt);
    var bd = document.createElement('div');
    bd.id = 'oc-docs-mobile-body';
    bd.style.cssText = 'flex:1;overflow-y:auto;padding:12px 0;';
    var sp = document.createElement('div'); sp.id='oc-mobile-sidebar-panel';
    var tp = document.createElement('div'); tp.id='oc-mobile-toc-panel'; tp.style.display='none';
    bd.appendChild(sp); bd.appendChild(tp);
    panel.appendChild(tb); panel.appendChild(bd);
    document.body.appendChild(back); document.body.appendChild(btn); document.body.appendChild(panel);
    btn.onclick = function() { refreshMobileNav(); panel.style.left='0'; back.style.display=''; document.body.style.overflow='hidden'; };
    back.onclick = closeNavPanel;
    dt.onclick = function() {
      dt.style.color='#ffe6cb'; dt.style.borderBottomColor='#ffd700';
      tt.style.color='rgba(255,230,203,.5)'; tt.style.borderBottomColor='transparent';
      sp.style.display=''; tp.style.display='none';
    };
    tt.onclick = function() {
      tt.style.color='#ffe6cb'; tt.style.borderBottomColor='#ffd700';
      dt.style.color='rgba(255,230,203,.5)'; dt.style.borderBottomColor='transparent';
      tp.style.display=''; sp.style.display='none';
    };
  }

  function init() {
    injectViewer();
    addDocsMobileNav();
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash && window.location.pathname.startsWith('/docs/')) {
      window.location.replace('/#docs');
      return;
    }
    // Handle initial hash on page load — triggers showDocs/loadContent
    if (window.location.hash) {
      onHashChange();
    }
    document.addEventListener('click', function(e) {
      var a = e.target.closest('a');
      if (a && a.getAttribute('href') && a.getAttribute('href').indexOf('/docs/') === 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var href = a.getAttribute('href');
        window.location.href = '/#' + href.substring(1);
      }
    }, true);
    if (window.location.hash.startsWith('#docs') || window.location.hash.startsWith('#skills')) {
      setTimeout(onHashChange, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
