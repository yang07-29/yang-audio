/* 课程级导航与本机学习记录；不联网，不录音，不上传阅读行为。 */
(() => {
  'use strict';
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const data = window.AUDIO_COURSE;
  if (!data) return;
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

  // 独立的课程目录替换单页解释器的字母导航，但不改动正文或代码。
  const sidebar = create('aside', 'course-sidebar');
  sidebar.setAttribute('aria-label', '课程导航');
  sidebar.append(create('div', 'course-eyebrow', 'AUDIO / 从零学音频'));
  sidebar.append(link('yang-audio', 'index.html', 'course-brand'));
  sidebar.append(create('p', 'course-side-description', '读懂原理 · 跑通代码 · 做出项目'));
  const search = create('input', 'course-search');
  search.type = 'search';
  search.placeholder = '查找课程，例如 AEC、分贝';
  search.setAttribute('aria-label', '按课程名称或关键词查找');
  sidebar.append(search);
  const nav = create('nav', 'course-lessons');
  nav.setAttribute('aria-label', '按顺序学习');
  const lessonLinks = [];
  for (const group of data.groups) {
    const block = create('section', 'course-nav-group');
    block.append(create('h2', '', group.title));
    for (const lesson of data.lessons.filter(item => item.group === group.id)) {
      const item = link('', lesson.url, 'course-lesson-link');
      item.append(create('span', 'course-lesson-number', lesson.number));
      item.append(create('span', 'course-lesson-title', lesson.short));
      item.append(create('span', 'course-complete-dot', state.done.includes(lesson.id) ? '✓' : ''));
      if (lesson.id === (page.parent || page.id)) {
        item.classList.add('is-active');
        item.setAttribute('aria-current', 'page');
      }
      if (state.done.includes(lesson.id)) item.setAttribute('aria-label', `${lesson.number} ${lesson.short}，已完成`);
      block.append(item);
      lessonLinks.push({ node: item, lesson, group: block });
    }
    nav.append(block);
  }
  const noResults = create('p', 'course-empty', '没有匹配课程。试试“采样”“ASR”或“阵列”。');
  noResults.hidden = true;
  nav.append(noResults);
  sidebar.append(nav);
  const utilities = create('nav', 'course-utilities');
  utilities.setAttribute('aria-label', '辅助资料');
  utilities.append(link('课程首页', 'index.html'));
  utilities.append(link('学习时间表', 'tutorial/study/plan.html'));
  utilities.append(link('三个项目', 'tutorial/study/projects.html'));
  utilities.append(link('中文视频', 'tutorial/study/videos.html'));
  utilities.append(link('可视化实验', 'tutorial/study/visuals.html'));
  utilities.append(link('随课实验', 'tutorial/experiments.html'));
  utilities.append(link('资料与内容审查', 'tutorial/resources.html'));
  sidebar.append(utilities);
  const count = create('p', 'course-progress-count');
  sidebar.append(count);
  document.body.prepend(sidebar);
  const updateCount = () => {
    count.textContent = fileMode
      ? `当前记录 ${state.done.length} / ${data.lessons.length} 课 · 文件模式跨页可能不共享`
      : `已标记完成 ${state.done.length} / ${data.lessons.length} 课 · 仅保存在本浏览器`;
  };
  updateCount();
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let total = 0;
    for (const row of lessonLinks) {
      const matched = `${row.lesson.number} ${row.lesson.short} ${row.lesson.keywords}`.toLowerCase().includes(query);
      row.node.hidden = !matched;
      if (matched) total++;
    }
    for (const block of nav.querySelectorAll('.course-nav-group')) {
      block.hidden = ![...block.querySelectorAll('.course-lesson-link')].some(item => !item.hidden);
    }
    noResults.hidden = total > 0;
  });

  const mobile = create('header', 'course-mobile-bar');
  mobile.append(link('音频算法入门课', 'index.html'));
  const menu = create('button', 'course-menu-button', '课程目录');
  menu.type = 'button';
  menu.setAttribute('aria-expanded', 'false');
  menu.addEventListener('click', () => {
    const open = document.body.classList.toggle('course-menu-open');
    menu.setAttribute('aria-expanded', String(open));
    if (open) search.focus();
  });
  mobile.append(menu);
  document.body.prepend(mobile);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.body.classList.remove('course-menu-open');
      menu.setAttribute('aria-expanded', 'false');
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
    crumb.append(link('课程首页', 'index.html'));
    if (page.kind !== 'home') {
      crumb.append(create('span', '', ' / '));
      crumb.append(create('span', '', page.kind === 'lab' ? '随课实验' : (page.stage || page.title)));
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
})();
