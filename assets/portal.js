/* 学习工作台：只重排入口，正文、学习进度和资料仍使用原文件。 */
(function () {
  'use strict';
  function resourceURL(raw, base) {
    try {
      const root = new URL(base);
      const url = new URL(raw, root);
      const path = decodeURIComponent(url.pathname);
      const prefix = decodeURIComponent(root.pathname);
      if (url.origin !== root.origin || url.protocol !== root.protocol || !path.startsWith(prefix)
          || !path.endsWith('.html') || path.slice(prefix.length) === 'index.html') return null;
      const parts = path.slice(prefix.length).split('/');
      if (path.includes('\\') || parts.some(part => part === '.' || part === '..') || /%2e|%2f|%5c/i.test(path)) return null;
      url.searchParams.delete('embedded');
      return { href: url.href, path: path.slice(prefix.length), route: url.pathname.slice(root.pathname.length) + url.search + url.hash };
    } catch (_) { return null; }
  }
  if (typeof module === 'object' && module.exports) { module.exports = { resourceURL }; return; }
  const script = document.currentScript;
  const root = new URL('../', script.src);
  function freshLessonURL(raw) {
    const url = new URL(raw, root);
    if (/\/tutorial\/video-lessons\/[^/]+\.html$/.test(url.pathname) && !url.searchParams.has('v')) url.searchParams.set('v', '20261027');
    return url;
  }
  function boot() {
    const body = document.querySelector('.am-doc-body');
    const dashboard = document.getElementById('study-dashboard');
    const data = window.AUDIO_COURSE;
    if (!body || !dashboard || !data || document.getElementById('portal-views')) return;
    document.body.classList.add('audio-portal');
    const el = (tag, cls, text) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const button = (label, action, cls = 'portal-button') => {
      const node = el('button', cls, label);
      node.type = 'button'; node.addEventListener('click', action); return node;
    };
    const link = (label, path, cls = 'portal-resource') => {
      const node = el('a', cls, label); node.href = freshLessonURL(path).href; return node;
    };
    const oldPanels = [...body.children].filter(node => node !== dashboard);
    const header = document.querySelector('.am-head');
    header.querySelector('h1').textContent = '音频算法学习手册';
    header.querySelector('.am-sub').textContent = '从声音基础，到能讲清、能验证的实习项目。';
    const views = el('div', 'portal-views'); views.id = 'portal-views';
    const viewMap = new Map();
    const makeView = (id, title, subtitle) => {
      const view = el('section', 'portal-view'); view.id = id;
      view.setAttribute('aria-label', title);
      if (subtitle) {
        const head = el('header', 'portal-section-head');
        head.append(el('h2', '', title), el('p', '', subtitle)); view.append(head);
      }
      viewMap.set(id, view); views.append(view); return view;
    };
    const today = makeView('learn-today', '今日学习'); today.append(dashboard);
    const catalog = makeView('learn-catalog', '课程目录', '按顺序补基础，也可以直接查知识点。每一课都保留完整正文、公式、注释代码与运行图。');
    catalog.append(link('查看 23 课图文 / 视频对照目录 →', 'tutorial/study/videos.html', 'portal-text-link'));
    const finder = el('input', 'portal-search'); finder.type = 'search';
    finder.placeholder = '搜索知识点，例如：分贝、AEC、ASR'; finder.setAttribute('aria-label', '搜索完整课程目录');
    catalog.append(finder);
    const catalogRows = [];
    for (const group of data.groups) {
      const lessons = data.lessons.filter(item => item.group === group.id);
      if (!lessons.length) continue;
      const section = el('details', 'portal-course-group'); section.open = ['guide', 'basics'].includes(group.id);
      const summary = el('summary'); summary.append(el('span', '', group.title), el('span', 'portal-count', `${lessons.length} 课`));
      const list = el('div', 'portal-course-list');
      for (const lesson of lessons) {
        const row = el('div', 'portal-course-row');
        row.append(el('span', 'portal-lesson-number', lesson.number));
        const text = el('span', 'portal-course-text');
        text.append(link(lesson.short, lesson.url, 'portal-lesson-title'), el('span', '', lesson.outcome));
        const choices = el('nav', 'portal-lesson-choices');
        choices.setAttribute('aria-label', `${lesson.short}的学习方式`);
        choices.append(link('读图文', lesson.url, 'portal-choice'));
        const paired = (window.AUDIO_VIDEO_LESSONS || []).find(item => item.source === lesson.url);
        if (paired) choices.append(link('看视频', paired.url, 'portal-choice'));
        row.append(text, choices); list.append(row);
        catalogRows.push({ row, section, text: `${lesson.number} ${lesson.short} ${lesson.keywords}`.toLowerCase() });
      }
      section.append(summary, list); catalog.append(section);
    }
    const empty = el('p', 'portal-empty', '没有找到这个知识点，试试更短的关键词。'); empty.hidden = true; catalog.append(empty);
    finder.addEventListener('input', () => {
      const query = finder.value.trim().toLowerCase();
      catalogRows.forEach(item => { item.row.hidden = !item.text.includes(query); if (query && !item.row.hidden) item.section.open = true; });
      new Set(catalogRows.map(item => item.section)).forEach(section => {
        section.hidden = !catalogRows.some(item => item.section === section && !item.row.hidden);
      });
      empty.hidden = catalogRows.some(item => !item.row.hidden);
    });
    const projects = makeView('learn-projects', '项目实战', '一条增强主线，两个对照方向。先读清楚输入、处理过程、评测与个人贡献。');
    const projectItems = [
      { id: 'gtcrn', name: 'GTCRN 语音增强', label: '主线项目', brief: '从复数掩码、增益校准到真实评测，讲透轻量降噪是怎样工作的。', tags: '增强 / 流式 / 评测', number: '01' },
      { id: 'convtasnet', name: 'Conv-TasNet 语音分离', label: '对照方向', brief: '看懂时域分离、PIT 与 SI-SDR，并用失败样例理解效果的边界。', tags: '分离 / 损失函数 / 对照实验', number: '02' },
      { id: 'zipformer', name: 'Zipformer 流式识别', label: '对照方向', brief: '理解分块、稳定输出与延迟，区分模型能力和工程策略的贡献。', tags: 'ASR / 分块 / 稳定性', number: '03' }
    ];
    const projectGrid = el('div', 'portal-project-grid');
    for (const item of projectItems) {
      const card = link('', `tutorial/projects/${item.id}/lesson.html`, 'portal-project-card');
      const top = el('div', 'portal-card-top'); top.append(el('span', 'portal-project-number', item.number), el('span', 'portal-badge', item.label));
      card.append(top, el('h3', '', item.name), el('p', '', item.brief), el('span', 'portal-tags', item.tags), el('span', 'portal-card-action', '进入项目 →'));
      projectGrid.append(card);
    }
    projects.append(projectGrid);
    projects.append(link('查看项目证据、阅读顺序与公开范围', 'tutorial/study/projects.html', 'portal-text-link'));
    const resources = makeView('learn-resources', '资料与工具', '实验、参考和旧版归档分开放。完整图文与视频也可以在这里按课查找。');
    const addCollection = (title, description, entries, opened = false) => {
      const section = el('details', 'portal-collection'); section.open = opened;
      section.append(el('summary', '', title), el('p', 'portal-collection-description', description));
      const list = el('div', 'portal-resource-list');
      entries.forEach(([label, path]) => list.append(link(label, path)));
      section.append(list); resources.append(section);
    };
    addCollection('图文与视频配套课程', '完整文字教程与逐课视频并列保留，按你理解得快的方式学习。', [
      ['全部 23 课 · 读图文 / 看视频', 'tutorial/study/videos.html'],
      ['从第 01 课开始：声音的三个旋钮', 'tutorial/video-lessons/01.html'],
      ['AEC：跟着算一次 NLMS', 'tutorial/video-lessons/08.html'],
      ...projectItems.map(p => [p.name, `tutorial/video-lessons/${p.id}.html`])
    ], true);
    addCollection('实验与参考资料', '代码、运行图、自测和证据说明集中查阅。', [
      ['交互可视化实验室', 'tutorial/study/visuals.html'], ['五个随课实验', 'tutorial/experiments.html'],
      ['术语与闭卷自测', 'tutorial/chapters/18_glossary.html'], ['源码、运行记录与内容审查', 'tutorial/resources.html']
    ]);
    addCollection('旧版完整资料', '历史内容全部保留；初学时建议先跟当前的连续课程。', [
      ['旧版 18 讲知识地图', 'overview.html'], ['15 讲实习实战详解', 'practical.html']
    ]);
    const guide = el('details', 'portal-collection portal-study-guide'); guide.id = 'learn-guide';
    guide.append(el('summary', '', '学习方法与课程完整说明'));
    oldPanels.forEach(panel => guide.append(panel)); resources.append(guide);

    const mobileTabs = el('nav', 'portal-mobile-tabs'); mobileTabs.setAttribute('aria-label', '学习区切换');
    for (const [id, label] of [['learn-today','今日'],['learn-catalog','课程'],['learn-projects','项目'],['learn-resources','资料']]) {
      const tab = link(label, `index.html#${id}`, 'portal-mobile-tab'); tab.dataset.portalView = id; mobileTabs.append(tab);
    }
    const workspace = el('section', 'portal-workspace'); workspace.id = 'portal-reader'; workspace.hidden = true;
    workspace.setAttribute('aria-label', '本页学习工作台');
    const toolbar = el('div', 'portal-reader-toolbar');
    let lastView = 'learn-today'; let returnFocus = null; let loadedHref = ''; let timeout = null;
    const back = button('← 返回任务', () => { location.hash = lastView; });
    const title = el('h2', 'portal-reader-title', '学习内容'); title.tabIndex = -1;
    const standalone = el('a', 'portal-standalone', '独立打开 ↗'); standalone.target = '_blank'; standalone.rel = 'noopener';
    toolbar.append(back, title, standalone);
    const quick = el('nav', 'portal-reader-switcher'); quick.setAttribute('aria-label', '正文、视频与实验切换');
    const status = el('p', 'portal-reader-status'); status.setAttribute('role', 'status');
    const frame = el('iframe', 'portal-reader-frame'); frame.title = '课程正文与视频';
    frame.setAttribute('allow', 'fullscreen'); frame.referrerPolicy = 'same-origin';
    workspace.append(toolbar, quick, status, frame);
    body.replaceChildren(mobileTabs, views, workspace);

    const pauseMedia = () => {
      try {
        const doc = frame.contentDocument;
        const toggle = doc?.querySelector('[data-amv="toggle"]');
        if (toggle && /暂停|pause/i.test(toggle.getAttribute('aria-label') || toggle.textContent)) toggle.click();
        doc?.querySelectorAll('audio,video').forEach(media => media.pause());
      } catch (_) {}
    };
    const titleFor = path => data.pages.find(item => item.url === path)?.title || (window.AUDIO_VIDEO_LESSONS || []).find(item => item.url === path)?.title || '学习内容';
    function updateQuick(resource) {
      const paired = (window.AUDIO_VIDEO_LESSONS || []).find(item => item.source === resource.path || item.url === resource.path);
      const project = projectItems.find(item => resource.path.startsWith(`tutorial/projects/${item.id}/`));
      let reading = resource.path;
      let video = null;
      if (paired) { reading = paired.source; video = paired.url; }
      else if (project) { reading = `tutorial/projects/${project.id}/lesson.html`; video = `tutorial/video-lessons/${project.id}.html`; }
      else {
        const day = window.AUDIO_STUDY_DATA?.days.find(item => item.url === resource.path || item.video === resource.path);
        if (day) { reading = day.url; video = day.video; }
      }
      const entries = [['读图文', reading], ...(video ? [['看视频', video]] : []), ['实验', 'tutorial/study/visuals.html']];
      quick.replaceChildren();
      for (const [label, path] of entries) {
        const item = link(label, path, 'portal-reader-tab');
        if (path === resource.path) item.setAttribute('aria-current', 'page');
        quick.append(item);
      }
      quick.append(el('span', 'portal-reader-hint', '看完返回任务打卡 · 进度不会因跳转自动完成'));
    }
    function showResource(resource) {
      pauseMedia();
      document.body.classList.add('portal-reading'); views.hidden = true; workspace.hidden = false;
      back.textContent = lastView === 'learn-today' ? '← 返回任务' : '← 返回列表';
      const href = freshLessonURL(resource.href).href;
      standalone.href = href;
      title.textContent = titleFor(resource.path);
      updateQuick(resource);
      if (loadedHref !== href) {
        loadedHref = href;
        status.textContent = '正在加载学习内容；有声讲解较大，首次打开请稍等。';
        const embedded = new URL(href); embedded.searchParams.set('embedded', '1');
        frame.src = embedded.href;
        clearTimeout(timeout);
        timeout = setTimeout(() => { status.textContent = '内容加载较慢；可以稍等，或用右上角“独立打开”查看。'; }, 20000);
      }
      title.focus({ preventScroll: true });
      workspace.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    frame.addEventListener('load', () => {
      if (!loadedHref) return;
      clearTimeout(timeout);
      try {
        const doc = frame.contentDocument;
        const actual = resourceURL(frame.contentWindow.location.href, root.href);
        if (!actual || !doc || !doc.body) throw new Error('Page not ready');
        const focusStyle = doc.createElement('style');
        focusStyle.textContent = '.am-toolbar,.am-colophon{display:none!important}';
        doc.head.append(focusStyle);
        title.textContent = doc.querySelector('h1')?.textContent || doc.title || titleFor(actual.path);
        standalone.href = actual.href;
        loadedHref = actual.href;
        updateQuick(actual);
        doc.querySelectorAll('a[href]').forEach(anchor => {
          if (anchor.origin !== location.origin) { anchor.target = '_blank'; anchor.rel = 'noopener'; }
        });
        // 接管同源文档间导航：返回首页退出阅读器，避免首页嵌套首页。
        doc.addEventListener('click', event => {
          if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
          const anchor = event.target.closest?.('a[href]');
          if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
          const destination = new URL(anchor.href, doc.location.href);
          if (destination.origin !== root.origin) return;
          let path;
          try { path = decodeURIComponent(destination.pathname).slice(decodeURIComponent(root.pathname).length); }
          catch (_) { return; }
          const alias = data.aliases[path];
          const isHome = destination.pathname === root.pathname || path === 'index.html' || alias === 'index.html';
          if (isHome) {
            event.preventDefault(); event.stopPropagation();
            location.hash = viewMap.has(destination.hash.slice(1)) ? destination.hash : '#learn-today';
            return;
          }
          // 同一课的小节锚点仍由文档原生滚动，不重载整页。
          if (destination.pathname === doc.location.pathname && destination.search === doc.location.search && destination.hash) return;
          const next = resourceURL(alias || destination.href, root.href);
          if (!next) return;
          event.preventDefault(); event.stopPropagation();
          if (next.path === 'tutorial/study/plan.html') location.href = next.href;
          else location.hash = '#read=' + encodeURIComponent(next.route);
        }, true);
        status.textContent = '已载入 · 在这里阅读、播放和做实验';
      } catch (_) { status.textContent = '无法确认内嵌页面是否加载完成，请使用“独立打开”。'; }
    });
    function route() {
      const hash = location.hash.slice(1);
      if (hash.startsWith('read=')) {
        let raw;
        try { raw = decodeURIComponent(hash.slice(5)); } catch (_) { raw = ''; }
        const resource = resourceURL(raw, root.href);
        if (resource) { showResource(resource); return; }
      }
      pauseMedia(); clearTimeout(timeout);
      document.body.classList.remove('portal-reading'); workspace.hidden = true; views.hidden = false;
      const id = viewMap.has(hash) ? hash : 'learn-today'; lastView = id;
      viewMap.forEach((view, key) => { view.hidden = key !== id; });
      mobileTabs.querySelectorAll('a').forEach(tab => {
        if (tab.dataset.portalView === id) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
      });
      if (returnFocus?.isConnected) { returnFocus.focus({ preventScroll: true }); returnFocus = null; }
    }
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const destination = new URL(anchor.href);
      if (destination.origin !== root.origin) return;
      if (destination.pathname === root.pathname || destination.pathname === root.pathname + 'index.html') {
        event.preventDefault();
        const targetHash = destination.hash || '#learn-today';
        if (location.hash === targetHash) route(); else location.hash = targetHash;
        return;
      }
      const resource = resourceURL(anchor.href, root.href);
      // 完整计划有独立日历视图；其余课程资源留在工作台内。
      if (!resource || resource.path === 'tutorial/study/plan.html') return;
      event.preventDefault(); returnFocus = anchor;
      const next = '#read=' + encodeURIComponent(resource.route);
      if (location.hash === next) showResource(resource); else location.hash = next;
    });
    window.addEventListener('hashchange', route);
    route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
