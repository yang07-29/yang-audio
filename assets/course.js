/* 课程级导航与本机学习记录；不联网，不录音，不上传阅读行为。 */
(() => {
  'use strict';
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const data = window.AUDIO_COURSE;
  if (!data) return;
  // 一份本地样式表服务全部课程页，不依赖第三方 CDN 或前端框架。
  document.body.classList.add('course-shell');
  const embedded = new URL(location.href).searchParams.get('embedded') === '1';
  if (embedded) document.body.classList.add('course-embedded');
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('course-shell.css', script.src).href;
  document.head.append(stylesheet);
  const absolute = path => new URL(path, root).href;
  const relative = decodeURIComponent(location.pathname).slice(decodeURIComponent(root.pathname).length);
  const redirect = data.aliases[relative];
  if (redirect) {
    location.replace(absolute(redirect));
    return;
  }
  const page = data.pages.find(item => item.url === relative) || data.pages[0];
  document.body.dataset.courseKind = page.kind;
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const link = (text, path, className = '') => {
    const node = create('a', className, text);
    node.href = absolute(path);
    return node;
  };
  let storageOK = true;
  const fileMode = location.protocol === 'file:';
  let state = { done: [], last: null };
  try {
    const saved = JSON.parse(localStorage.getItem('audio-course-progress-v4') || 'null');
    if (saved && Array.isArray(saved.done)) {
      state.done = saved.done.filter(id => data.lessons.some(item => item.id === id));
      state.last = data.lessons.some(item => item.id === saved.last) ? saved.last : null;
    }
  } catch (_) { storageOK = false; }
  const save = () => {
    try { localStorage.setItem('audio-course-progress-v4', JSON.stringify(state)); }
    catch (_) { storageOK = false; }
  };
  const priorLesson = data.lessons.find(item => item.id === state.last);
  if (page.kind === 'lesson') {
    state.last = page.id;
    save();
  }

  // 主入口、课程目录和辅助资料分区，避免将所有链接堆在同一层级。
  const sidebar = create('aside', 'course-sidebar');
  sidebar.id = 'course-sidebar';
  sidebar.setAttribute('aria-label', '课程导航');
  const drawerClose = create('button', 'course-drawer-close', '×');
  drawerClose.type = 'button';
  drawerClose.setAttribute('aria-label', '关闭学习导航');
  sidebar.append(drawerClose);
  sidebar.append(create('div', 'course-eyebrow', 'AUDIO LEARNING STUDIO'));
  sidebar.append(link('yang-audio', 'index.html', 'course-brand'));
  sidebar.append(create('p', 'course-side-description', '每天一点，把声音学明白。'));
  const primary = create('nav', 'course-primary-nav');
  primary.setAttribute('aria-label', '学习主入口');
  const primaryItems = [
    ['今日学习', 'index.html', 'today', '01'],
    ['课程目录', 'index.html#learn-catalog', 'catalog', '02'],
    ['项目实战', 'index.html#learn-projects', 'projects', '03'],
    ['学习计划', 'tutorial/study/plan.html', 'plan', '04']
  ];
  const primaryLinks = primaryItems.map(([title, path, id, number]) => {
    const item = link('', path, 'course-primary-link');
    item.dataset.section = id;
    const marker = create('span', 'course-primary-number', number);
    marker.setAttribute('aria-hidden', 'true');
    item.append(marker, create('span', '', title));
    primary.append(item);
    return item;
  });
  const highlightPrimary = () => {
    let section = page.kind === 'home'
      ? ({ '#learn-catalog': 'catalog', '#learn-projects': 'projects', '#learn-resources': 'resources' }[location.hash] || 'today')
      : relative === 'tutorial/study/plan.html' ? 'plan'
        : page.kind === 'project-guide' || relative === 'tutorial/study/projects.html' ? 'projects'
          : page.kind === 'lesson' || page.kind === 'lab' ? 'catalog' : 'resources';
    if (page.kind === 'home' && location.hash.startsWith('#read=')) {
      try {
        const reading = decodeURIComponent(location.hash.slice(6));
        section = reading.startsWith('tutorial/projects/') ? 'projects'
          : reading.startsWith('tutorial/chapters/') || reading.startsWith('tutorial/labs/') ? 'catalog' : 'resources';
      } catch (_) { section = 'today'; }
    }
    for (const item of primaryLinks) {
      const active = item.dataset.section === section;
      item.classList.toggle('is-active', active);
      if (active) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    }
  };
  highlightPrimary();
  addEventListener('hashchange', highlightPrimary);
  sidebar.append(primary);
  const directory = create('div', 'course-directory');
  directory.append(create('div', 'course-nav-label', '课程速查'));
  const search = create('input', 'course-search');
  search.type = 'search';
  search.placeholder = '搜索课程或关键词…';
  search.setAttribute('aria-label', '按课程名称或关键词查找');
  directory.append(search);
  const nav = create('nav', 'course-lessons');
  nav.setAttribute('aria-label', '按顺序学习');
  const lessonLinks = [];
  const groups = [];
  for (const group of data.groups) {
    const lessons = data.lessons.filter(item => item.group === group.id);
    const current = lessons.some(lesson => lesson.id === (page.parent || page.id));
    const block = create('details', 'course-nav-group');
    block.open = current;
    const summary = create('summary', 'course-group-summary');
    summary.append(create('span', '', group.title.replace(/第[一二三四]阶段 · /, '')));
    const groupCount = create('span', 'course-group-count', String(lessons.length));
    groupCount.setAttribute('aria-label', `${lessons.length} 课`);
    summary.append(groupCount);
    block.append(summary);
    const content = create('div', 'course-group-content');
    for (const lesson of lessons) {
      const item = link('', lesson.url, 'course-lesson-link');
      item.append(create('span', 'course-lesson-number', lesson.number));
      item.append(create('span', 'course-lesson-title', lesson.short));
      item.append(create('span', 'course-complete-dot', state.done.includes(lesson.id) ? '✓' : ''));
      if (lesson.id === (page.parent || page.id)) {
        item.classList.add('is-active');
        item.setAttribute('aria-current', 'page');
      }
      if (state.done.includes(lesson.id)) item.setAttribute('aria-label', `${lesson.number} ${lesson.short}，已完成`);
      content.append(item);
      lessonLinks.push({ node: item, lesson, group: block });
    }
    block.append(content);
    groups.push({ node: block, defaultOpen: current });
    nav.append(block);
  }
  const noResults = create('p', 'course-empty', '没有匹配课程。试试“采样”“ASR”或“阵列”。');
  noResults.hidden = true;
  nav.append(noResults);
  directory.append(nav);
  sidebar.append(directory);
  const resourceBlock = create('details', 'course-resource-group');
  resourceBlock.append(create('summary', '', '辅助资料'));
  const utilities = create('nav', 'course-utilities');
  utilities.setAttribute('aria-label', '辅助资料');
  utilities.append(link('资源总览', 'index.html#learn-resources'));
  utilities.append(link('中文视频', 'tutorial/study/videos.html'));
  utilities.append(link('可视化实验', 'tutorial/study/visuals.html'));
  utilities.append(link('随课实验', 'tutorial/experiments.html'));
  utilities.append(link('资料与内容审查', 'tutorial/resources.html'));
  resourceBlock.append(utilities);
  sidebar.append(resourceBlock);
  const progress = create('div', 'course-progress');
  const count = create('p', 'course-progress-count');
  const progressBar = create('progress', 'course-progress-bar');
  progressBar.max = data.lessons.length;
  progressBar.setAttribute('aria-label', '课程完成进度');
  progress.append(count, progressBar);
  sidebar.append(progress);
  document.body.prepend(sidebar);
  const updateCount = () => {
    count.textContent = `已完成 ${state.done.length} / ${data.lessons.length} 课`;
    count.title = fileMode ? '文件模式跨页可能不共享记录' : '仅保存在当前浏览器，不会跨设备同步';
    progressBar.value = state.done.length;
  };
  updateCount();
  // 同源 iframe 内完成课程后，侧栏同步显示，无需刷新整个学习台。
  addEventListener('storage', event => {
    if (event.key !== 'audio-course-progress-v4') return;
    try {
      const saved = JSON.parse(event.newValue || 'null');
      if (!saved || !Array.isArray(saved.done)) return;
      state.done = saved.done.filter(id => data.lessons.some(item => item.id === id));
      for (const row of lessonLinks) row.node.querySelector('.course-complete-dot').textContent = state.done.includes(row.lesson.id) ? '✓' : '';
      updateCount();
    } catch (_) { /* 无效跨页记录不覆盖当前显示。 */ }
  });
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let total = 0;
    for (const row of lessonLinks) {
      const matched = `${row.lesson.number} ${row.lesson.short} ${row.lesson.keywords}`.toLowerCase().includes(query);
      row.node.hidden = !matched;
      if (matched) total++;
    }
    for (const group of groups) {
      const block = group.node;
      block.hidden = ![...block.querySelectorAll('.course-lesson-link')].some(item => !item.hidden);
      block.open = query ? !block.hidden : group.defaultOpen;
    }
    noResults.hidden = total > 0;
  });

  const mobile = create('header', 'course-mobile-bar');
  mobile.append(link('yang-audio', 'index.html'));
  const menu = create('button', 'course-menu-button', '学习导航');
  menu.type = 'button';
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-controls', sidebar.id);
  const shade = create('button', 'course-menu-shade');
  shade.type = 'button';
  shade.tabIndex = -1;
  shade.setAttribute('aria-label', '关闭学习导航');
  shade.hidden = true;
  document.body.prepend(shade);
  const mobileQuery = matchMedia('(max-width: 880px)');
  const setMenu = (open, restoreFocus = false) => {
    document.body.classList.toggle('course-menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    shade.hidden = !open;
    sidebar.inert = mobileQuery.matches && !open;
    if (open) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      search.focus();
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      if (restoreFocus) menu.focus();
    }
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true', true));
  shade.addEventListener('click', () => setMenu(false, true));
  drawerClose.addEventListener('click', () => setMenu(false, true));
  sidebar.addEventListener('click', event => {
    if (event.target.closest('a') && mobileQuery.matches) setMenu(false, false);
  });
  mobileQuery.addEventListener('change', () => setMenu(false));
  setMenu(false);
  mobile.append(menu);
  document.body.prepend(mobile);
  document.addEventListener('keydown', event => {
    if (menu.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') {
      setMenu(false, true);
      event.preventDefault();
    } else if (event.key === 'Tab') {
      // 抽屉打开时保持键盘焦点在导航内，Escape 可随时退出。
      const focusable = [...sidebar.querySelectorAll('a[href], button, input, summary')]
        .filter(node => !node.hidden && node.getClientRects().length > 0);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === menu)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    }
  });

  // 只清理渲染器的展示编号，面板锚点不变，书签仍然可跳转。
  const toc = document.querySelector('.am-toc');
  if (toc) {
    toc.setAttribute('aria-label', '本页目录');
    toc.prepend(create('div', 'course-toc-title', '本页目录'));
    toc.querySelectorAll('a').forEach(item => {
      item.textContent = item.textContent.replace(/^[A-Z][0-9]?\s*·\s*/, '');
    });
  }
  const mainHeader = document.querySelector('.am-head');
  if (mainHeader) {
    const crumb = create('div', 'course-breadcrumb');
    crumb.append(link('学习空间', 'index.html'));
    if (page.kind !== 'home') {
      crumb.append(create('span', '', ' / '));
      crumb.append(create('span', '', page.kind === 'lab' ? '随课实验' : page.kind === 'lesson' ? (page.stage || '课程') : page.kind === 'project-guide' ? '项目实战' : '辅助资料'));
    }
    mainHeader.prepend(crumb);
    const meta = create('div', 'course-page-meta');
    if (page.kind === 'lesson') {
      meta.append(create('span', '', '先修：' + page.prerequisite));
      meta.append(create('span', '', '学完：' + page.outcome));
    } else if (page.kind === 'lab') {
      const parent = data.lessons.find(item => item.id === page.parent);
      meta.append(link('配套课程：' + parent.number + ' ' + parent.short, parent.url));
      meta.append(create('span', '', '先预测 → 看代码 → 读结果 → 改一个参数'));
    }
    if (meta.childNodes.length) mainHeader.append(meta);
  }
  const article = document.querySelector('.am-doc-body');
  if (page.kind === 'lesson' && article) {
    const completion = create('section', 'course-completion');
    completion.append(create('h2', '', '本课学完了吗？'));
    completion.append(create('p', '', '能独立解释本课目标，并完成对应自测后再标记。点击下一课不会自动算作掌握。'));
    const button = create('button', 'course-primary-button');
    button.type = 'button';
    const status = create('p', 'course-storage-note');
    const redraw = () => {
      const done = state.done.includes(page.id);
      button.textContent = done ? '已完成 · 点击撤销' : '标记本课已完成';
      button.setAttribute('aria-pressed', String(done));
      status.textContent = !storageOK
        ? '浏览器阻止了本地保存；本次标记不会可靠保留。'
        : fileMode
          ? '当前直接打开HTML文件，浏览器可能为每一页隔离记录；跨页进度不保证共享。本地HTTP方式可使用同一站点记录，仍不会跨设备同步。'
          : '进度仅保存在当前浏览器；换设备不会自动同步。';
      lessonLinks.filter(row => row.lesson.id === page.id).forEach(row => {
        row.node.querySelector('.course-complete-dot').textContent = done ? '✓' : '';
        row.node.setAttribute('aria-label', `${row.lesson.number} ${row.lesson.short}${done ? '，已完成' : ''}`);
      });
      updateCount();
    };
    button.addEventListener('click', () => {
      state.done = state.done.includes(page.id) ? state.done.filter(id => id !== page.id) : [...state.done, page.id];
      save(); redraw();
    });
    completion.append(button, status);
    article.append(completion);
    redraw();
  }
  if (page.kind === 'home' && priorLesson && mainHeader) {
    mainHeader.append(link(`继续上次：${priorLesson.number} ${priorLesson.short}`, priorLesson.url, 'course-resume-link'));
  }
  if (embedded) {
    // 内嵌阅读的下一课、实验链接继续留在阅读区；独立打开仍显示完整外壳。
    document.addEventListener('click', event => {
      const anchor = event.target.closest('a[href]');
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname) || !url.pathname.endsWith('.html')) return;
      url.searchParams.set('embedded', '1');
      anchor.href = url.href;
    });
  }
})();
