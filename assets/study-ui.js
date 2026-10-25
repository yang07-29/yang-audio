/* 每日学习卡：只在首页和时间表页运行，不联网、不自动标记任务。 */
(function () {
  'use strict';
  const MAX_NOTE = 10000;
  const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
  const ALLOWED_MINUTES = [90, 120, 150];

  // 导入比 normalize 更严格：坏数据不能被静默“修好”后覆盖现有进度。
  function validateProgress(raw, data, core) {
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
      && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
    const fail = message => { throw new Error(message); };
    if (!object(raw)) fail('进度文件顶层必须是一个 JSON 对象。');
    const allowed = ['version', 'start', 'minutes', 'done', 'notes'];
    if (Object.keys(raw).length !== allowed.length || Object.keys(raw).some(key => !allowed.includes(key)))
      fail('文件字段必须且只能包含 version、start、minutes、done、notes。');
    if (raw.version !== 1) fail('不支持这个进度版本，请使用本站导出的 version 1 文件。');
    if (!core.validDate(raw.start)) fail('计划开始日期必须是有效的 YYYY-MM-DD。');
    if (!core.validDate(core.dateAt(raw.start, data.days.length - 1))) fail('计划结束日期超出支持范围。');
    if (!ALLOWED_MINUTES.includes(raw.minutes)) fail('每日预算只能是 90、120 或 150 分钟。');
    if (!object(raw.done) || !object(raw.notes)) fail('done 和 notes 必须是对象。');
    const ids = new Set(data.days.map(day => day.id));
    for (const group of [raw.done, raw.notes]) {
      if (Object.keys(group).length > ids.size) fail('进度中的天数超过本课程范围。');
      if (Object.keys(group).some(id => !ids.has(id))) fail('文件含有不属于本课程的任务编号。');
    }
    for (const checks of Object.values(raw.done)) {
      if (!Array.isArray(checks) || checks.length !== 5 || checks.some(value => typeof value !== 'boolean'))
        fail('每一天的 done 必须是 5 个布尔值，不能用数字或文字代替。');
    }
    for (const note of Object.values(raw.notes)) {
      if (typeof note !== 'string' || note.length > MAX_NOTE)
        fail('每天的笔记必须是文字，且不超过 10,000 个字符。');
    }
    return core.normalize(raw, data);
  }

  // 可用 Node 单测导入校验，不需要启动浏览器或访问 DOM。
  if (typeof module === 'object' && module.exports) {
    module.exports = { validateProgress, MAX_NOTE, MAX_IMPORT_BYTES };
    return;
  }

  const script = document.currentScript;
  if (!script || !script.src) return;
  const root = new URL('../', script.src);
  let relative;
  try {
    const pagePath = decodeURIComponent(location.pathname);
    const rootPath = decodeURIComponent(root.pathname);
    if (!pagePath.startsWith(rootPath)) return;
    relative = pagePath.slice(rootPath.length);
  } catch (_) { return; }
  if (!['', 'index.html', 'tutorial/study/plan.html'].includes(relative)) return;

  function boot() {
    const host = document.querySelector('.am-doc-body');
    if (!host || document.getElementById('study-dashboard')) return;
    const data = window.AUDIO_STUDY_DATA;
    const core = window.AudioStudyCore;
    const el = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = String(text);
      return node;
    };
    if (!data || !core || !Array.isArray(data.days) || !data.days.length) {
      const warning = el('p', 'study-warning', '每日计划尚未加载，请刷新页面。课程正文仍可继续阅读。');
      warning.setAttribute('role', 'alert');
      host.prepend(warning);
      return;
    }
    const isPlan = relative === 'tutorial/study/plan.html';
    const key = 'yang-audio-study-v1:' + root.pathname;
    let storageIssue = '';
    let storedInvalid = false;
    let savedOnce = false;
    let state = core.normalize(null, data);
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          if (raw.length > MAX_IMPORT_BYTES) throw new Error('本机记录过大');
          state = validateProgress(JSON.parse(raw), data, core);
          savedOnce = true;
        } catch (_) {
          storedInvalid = true;
          storageIssue = '已有本机记录格式异常，本站没有覆盖它。当前操作仅留在本页，请先导出备份；确认导入有效文件后才会替换旧记录。';
        }
      }
    } catch (_) {
      storageIssue = '浏览器不允许读取本机存储。当前进度只留在本页，关闭前请导出 JSON 备份。';
    }

    function todayInfo() {
      const now = new Date();
      try {
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(now);
        const part = type => parts.find(item => item.type === type).value;
        return { date: `${part('year')}-${part('month')}-${part('day')}`, zone: '北京时间 · Asia/Shanghai' };
      } catch (_) {
        const pad = value => String(value).padStart(2, '0');
        return { date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, zone: '浏览器本地日期（时区转换不可用）' };
      }
    }
    let today = todayInfo();
    const clamp = index => Math.min(data.days.length - 1, Math.max(0, index));
    let selected = clamp(core.indexAt(state.start, today.date));
    if (core.indexAt(state.start, today.date) >= data.days.length) {
      const pending = core.nextPending(state, data);
      if (pending >= 0) selected = pending;
    }
    const queryDay = new URL(location.href).searchParams.get('day');
    const queried = data.days.findIndex(day => day.id === queryDay);
    if (queried >= 0) selected = queried;
    const urlFor = path => {
      if (typeof path !== 'string' || !path) return null;
      try {
        const url = new URL(path, root);
        if (url.origin !== root.origin || url.protocol !== root.protocol
          || !decodeURIComponent(url.pathname).startsWith(decodeURIComponent(root.pathname))
          || !url.pathname.endsWith('.html')) return null;
        return url.href;
      } catch (_) { return null; }
    };
    const link = (label, path, className = 'study-link') => {
      const href = urlFor(path);
      const node = el(href ? 'a' : 'span', className, label);
      if (href) node.href = href;
      else node.textContent += '（链接尚未配置）';
      return node;
    };
    const button = (label, action, className = 'study-button') => {
      const node = el('button', className, label);
      node.type = 'button';
      node.addEventListener('click', action);
      return node;
    };
    const labelFor = (label, input) => {
      const wrapper = el('label', 'study-field');
      wrapper.append(el('span', 'study-field-label', label), input);
      return wrapper;
    };

    const panel = el('section', 'study-dashboard');
    panel.id = 'study-dashboard';
    panel.setAttribute('aria-labelledby', 'study-heading');
    const top = el('div', 'study-topline');
    top.append(el('span', 'study-kicker', 'YANG AUDIO / 每日学习'));
    const todayLabel = el('span', 'study-date-label');
    top.append(todayLabel);
    panel.append(top);
    const heading = el('h2', 'study-heading');
    heading.id = 'study-heading';
    heading.tabIndex = -1;
    panel.append(heading);
    const calendarStatus = el('p', 'study-calendar-status');
    panel.append(calendarStatus);
    const progressBar = el('progress', 'study-progress');
    progressBar.max = data.days.length;
    progressBar.setAttribute('aria-label', '已完成全部 5 项核心任务的天数');
    const progressText = el('p', 'study-progress-text');
    progressText.setAttribute('aria-live', 'polite');
    progressText.setAttribute('aria-atomic', 'true');
    panel.append(progressBar, progressText);
    const completion = el('p', 'study-success');
    completion.hidden = true;
    panel.append(completion);
    const warning = el('p', 'study-warning');
    warning.setAttribute('role', 'alert');
    warning.hidden = true;
    panel.append(warning);
    const notice = el('p', 'study-notice');
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    panel.append(notice);

    const controls = el('div', 'study-controls');
    const duration = el('select', 'study-select');
    duration.id = 'study-duration';
    for (const minutes of ALLOWED_MINUTES) {
      const option = el('option', '', minutes === 90 ? '90 分钟 · 核心任务' : `${minutes} 分钟 · 核心＋加练`);
      option.value = String(minutes);
      duration.append(option);
    }
    duration.value = String(state.minutes);
    controls.append(labelFor('每天可用时间', duration));
    const chosenDate = el('input', 'study-input');
    chosenDate.type = 'date';
    chosenDate.id = 'study-selected-date';
    controls.append(labelFor('查看哪一天', chosenDate));
    const browse = el('div', 'study-browse');
    const previous = button('← 前一天', () => selectDay(selected - 1));
    const next = button('后一天 →', () => selectDay(selected + 1));
    const backToday = button('回到今天', () => {
      today = todayInfo();
      const index = core.indexAt(state.start, today.date);
      selectDay(clamp(index));
      if (index < 0) announce('计划还未开始，已显示第 1 天；你可以预习，但不会自动标记完成。');
      else if (index >= data.days.length) announce('今天已超过计划日期，已显示最后一天。也可以点击“补最早未完成”。');
    });
    const catchUp = button('补最早未完成', () => {
      const index = core.nextPending(state, data);
      if (index < 0) announce('全部核心任务已完成。你仍可以查看任意一天或做加练。');
      else { selectDay(index); announce(`已跳到第 ${index + 1} 天，保留你的原有完成记录。`); }
    });
    browse.append(previous, next, backToday, catchUp);
    controls.append(browse);
    panel.append(controls);
    const dayIntro = el('p', 'study-focus');
    const taskList = el('ol', 'study-task-list');
    taskList.setAttribute('aria-label', '当天的 5 项核心学习任务');
    panel.append(dayIntro, taskList);
    const extra = el('section', 'study-extra');
    extra.setAttribute('aria-label', '按所选预算增加的练习');
    panel.append(extra);

    const noteDetails = el('details', 'study-note-section');
    noteDetails.open = true;
    noteDetails.append(el('summary', '', '学习笔记与加练记录'));
    const notes = el('textarea', 'study-notes');
    notes.id = 'study-notes';
    notes.rows = 5;
    notes.maxLength = MAX_NOTE;
    notes.placeholder = '写下：今天能解释什么？哪里卡住？预测与运行结果是否一致？加练是否完成？';
    const noteLabel = labelFor('当前这一天的笔记（自动保存在本浏览器）', notes);
    noteDetails.append(noteLabel);
    const noteCount = el('p', 'study-small');
    notes.setAttribute('aria-describedby', 'study-note-count');
    noteCount.id = 'study-note-count';
    noteDetails.append(noteCount);
    panel.append(noteDetails);
    const quickLinks = el('nav', 'study-quicklinks');
    quickLinks.setAttribute('aria-label', '学习工具');
    quickLinks.append(link('可视化实验室', 'tutorial/study/visuals.html'),
      link('完整 11 周时间表', 'tutorial/study/plan.html'), link('回课程首页', 'index.html'));
    panel.append(quickLinks);

    const settings = el('details', 'study-settings');
    settings.append(el('summary', '', '计划日期、备份与恢复'));
    const shiftNote = el('p', 'study-small', '调整开始日会平移整份计划，不会删除已完成任务或笔记。只想补课时，不必改日期。');
    settings.append(shiftNote);
    const startDate = el('input', 'study-input');
    startDate.type = 'date';
    startDate.value = state.start;
    const startControls = el('div', 'study-setting-row');
    startControls.append(labelFor('计划开始日期', startDate), button('应用新开始日', () => {
      if (!core.validDate(startDate.value)) { announce('请选择有效的计划开始日期。'); return; }
      let end;
      try { end = core.dateAt(startDate.value, data.days.length - 1); }
      catch (_) { announce('这个日期无法计算完整计划，请换一个日期。'); return; }
      if (!core.validDate(end)) { announce('计划结束日期超出支持范围。'); return; }
      if (startDate.value === state.start) { announce('开始日期没有变化。'); return; }
      if (!window.confirm(`把计划改为 ${startDate.value} 至 ${end}？\n所有任务编号、完成记录和笔记都会保留，只平移日期。`)) {
        startDate.value = state.start;
        return;
      }
      state.start = startDate.value;
      persist();
      selected = clamp(core.indexAt(state.start, today.date));
      renderDay();
      announce('已平移计划日期；完成记录与笔记保持不变。');
    }));
    settings.append(startControls);
    const io = el('div', 'study-io');
    const importer = el('input', 'study-file');
    importer.type = 'file';
    importer.accept = '.json,application/json';
    importer.id = 'study-import';
    io.append(button('导出进度 JSON', () => {
      try {
        const text = JSON.stringify(validateProgress(state, data, core), null, 2);
        const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        const address = URL.createObjectURL(blob);
        const download = el('a');
        download.href = address;
        download.download = `yang-audio-progress-${today.date}.json`;
        document.body.append(download);
        download.click();
        download.remove();
        setTimeout(() => URL.revokeObjectURL(address), 1000);
        announce('已请求下载进度文件，请确认文件已保存。它包含完成记录与笔记，不包含课程内容。');
      } catch (_) { announce('导出未能完成。请先复制笔记，检查浏览器是否允许下载。'); }
    }), labelFor('导入本站进度 JSON', importer));
    settings.append(io, el('p', 'study-small', '导入会先校验，再让你确认覆盖。建议先导出当前记录。文件中的笔记只作为文字显示，不执行代码。'));
    panel.append(settings);
    const privacy = el('p', 'study-storage');
    panel.append(privacy);
    let weekArea = null;
    const weekNodes = [];
    const dayNodes = [];
    if (isPlan) {
      weekArea = el('section', 'study-weeks');
      weekArea.setAttribute('aria-labelledby', 'study-weeks-heading');
      const title = el('h3', '', '逐周任务 · 点击某天查看完整学习卡');
      title.id = 'study-weeks-heading';
      weekArea.append(title);
      for (const week of data.weeks) {
        const section = el('details', 'study-week');
        section.open = week.number === data.days[selected].week;
        const summary = el('summary');
        const titleNode = el('span', 'study-week-title', `第 ${week.number} 周 · ${week.title}`);
        const count = el('span', 'study-week-count');
        summary.append(titleNode, count);
        const range = el('p', 'study-small');
        section.append(summary, range, el('p', 'study-week-outcome', `本周产物：${week.outcome}`));
        const list = el('ul', 'study-week-days');
        for (let index = week.first - 1; index < week.last; index++) {
          if (!data.days[index]) continue;
          const day = data.days[index];
          const row = el('li', 'study-week-day');
          const select = button('', () => { selectDay(index); panel.scrollIntoView({ block: 'start' }); }, 'study-day-button');
          const status = el('span', 'study-day-status');
          row.append(select, status);
          list.append(row);
          dayNodes.push({ index, day, row, select, status });
        }
        section.append(list);
        weekArea.append(section);
        weekNodes.push({ week, section, range, count });
      }
      panel.append(weekArea);
    }
    host.prepend(panel);

    function announce(text) { notice.textContent = text; }
    function updateStorage() {
      warning.hidden = !storageIssue;
      warning.textContent = storageIssue;
      const fileWarning = location.protocol === 'file:'
        ? ' 当前为文件模式，首页与时间表的存储可能不共享；请固定一个页面打卡，跨页或迁移时用导出/导入。'
        : ' 首页和时间表在同一站点共享记录；不同设备、浏览器或站点不会自动同步。';
      privacy.textContent = (storageIssue ? '当前记录可能只存在于本页。' : savedOnce ? '已在本浏览器保存。' : '首次操作后自动保存在本浏览器。')
        + ' 学习记录不会上传；清理浏览器数据可能清除记录，请定期导出。' + fileWarning;
    }
    function persist(replaceInvalid = false) {
      if (storedInvalid && !replaceInvalid) { updateStorage(); return false; }
      try {
        localStorage.setItem(key, JSON.stringify(state));
        storageIssue = '';
        storedInvalid = false;
        savedOnce = true;
        updateStorage();
        return true;
      } catch (_) {
        storageIssue = '未能保存到本机存储（可能被禁用或空间不足）。本页仍保留你的操作，请在关闭或刷新前导出进度 JSON。';
        updateStorage();
        return false;
      }
    }
    function updateProgress() {
      const completeDays = data.days.filter(day => core.isComplete(state.done[day.id])).length;
      const currentChecks = state.done[data.days[selected].id] || Array(5).fill(false);
      const count = currentChecks.filter(Boolean).length;
      progressBar.value = completeDays;
      progressText.textContent = `核心进度 ${completeDays} / ${data.days.length} 天 · 当前这天 ${count} / 5 项完成。`
        + (state.minutes > 90 ? ' 加练不计入这 5 项，请在笔记中单独记录。' : ' 只有手动完成 5 项才算完成一天。');
      const allDone = completeDays === data.days.length;
      completion.hidden = !allDone;
      completion.textContent = `已完成全部 ${data.days.length} 天的核心任务！你仍可复习、补充笔记或继续加练。加练是否完成请以笔记核对。`;
      catchUp.disabled = allDone;
      for (const entry of dayNodes) {
        const checks = state.done[entry.day.id] || [];
        const done = core.isComplete(checks);
        entry.row.classList.toggle('is-done', done);
        entry.row.classList.toggle('is-selected', entry.index === selected);
        if (entry.index === selected) entry.select.setAttribute('aria-current', 'date');
        else entry.select.removeAttribute('aria-current');
        entry.select.textContent = `第 ${entry.index + 1} 天 · ${core.dateAt(state.start, entry.index)} · ${entry.day.title}`;
        entry.status.textContent = done ? '✓ 核心完成' : `${checks.filter(Boolean).length} / 5 项`;
      }
      for (const entry of weekNodes) {
        const weekDays = data.days.slice(entry.week.first - 1, entry.week.last);
        entry.count.textContent = `${weekDays.filter(day => core.isComplete(state.done[day.id])).length} / ${weekDays.length} 天`;
        entry.range.textContent = `${core.dateAt(state.start, entry.week.first - 1)} — ${core.dateAt(state.start, entry.week.last - 1)}`;
      }
      updateStorage();
    }
    function selectDay(index) {
      selected = clamp(index);
      renderDay();
      heading.focus({ preventScroll: true });
    }
    function renderDay() {
      const day = data.days[selected];
      const date = core.dateAt(state.start, selected);
      const nowIndex = core.indexAt(state.start, today.date);
      const end = core.dateAt(state.start, data.days.length - 1);
      todayLabel.textContent = `今天 ${today.date} · ${today.zone}`;
      heading.textContent = `${date === today.date ? '今天的' : `第 ${selected + 1} 天 · `}${state.minutes} 分钟学习卡`;
      let position;
      if (nowIndex < 0) position = `距离开始还有 ${-nowIndex} 天，可先预习`;
      else if (nowIndex >= data.days.length) position = `原计划日期已结束 ${nowIndex - data.days.length + 1} 天，仍可补课`;
      else position = `今天是计划第 ${nowIndex + 1} / ${data.days.length} 天`;
      calendarStatus.textContent = `${state.start} 至 ${end} · ${position}。当前查看 ${date}，第 ${day.week} 周。`;
      chosenDate.min = state.start;
      chosenDate.max = end;
      chosenDate.value = date;
      duration.value = String(state.minutes);
      previous.disabled = selected === 0;
      next.disabled = selected === data.days.length - 1;
      dayIntro.textContent = `${day.title}｜${day.focus}${day.practice ? '。今天重点是动手验证，不只阅读。' : '。今天先建立直觉，再解释关键步骤。'}`;
      taskList.replaceChildren();
      const reviewIndex = Number.isInteger(day.review) ? day.review - 1 : -1;
      const reviewDay = reviewIndex >= 0 && reviewIndex < selected ? data.days[reviewIndex] : null;
      const reviewText = typeof day.review === 'string' ? day.review : reviewDay
        ? `先不看答案，复述第 ${reviewIndex + 1} 天“${reviewDay.focus}”。再用原课自测检查遗漏。`
        : `先写下对“${day.focus}”的已有理解与 2 个问题。学完后回来检查。`;
      const tasks = [
        { title: '主动回忆', text: reviewText, url: reviewDay ? reviewDay.url : null, label: '打开回顾课程' },
        { title: '正文与核心代码', text: `${day.practice ? '逐行追踪核心代码的输入、输出和中间变量。' : '阅读对应小节，画出概念或处理流程。'}重点：${day.focus}。`, url: day.url, label: '打开今天的课程' },
        { title: '视频讲解', text: '看中文讲解，暂停复述一遍；把一个动画节点对应到正文或代码。视频短于 15 分钟时，用余下时间重画流程。', url: day.video, label: '观看配音与字幕讲解' },
        { title: '练习与可视化', text: day.exercise, url: 'tutorial/study/visuals.html', label: '打开可视化实验室' },
        { title: '闭卷自测与复盘', text: day.question, answer: day.answer }
      ];
      const checks = state.done[day.id] || Array(5).fill(false);
      tasks.forEach((task, index) => {
        const row = el('li', 'study-task');
        row.classList.toggle('is-done', checks[index]);
        const check = el('input', 'study-check');
        check.type = 'checkbox';
        check.id = `study-check-${day.id}-${index}`;
        check.checked = checks[index];
        const content = el('div', 'study-task-content');
        const title = el('label', 'study-task-title');
        title.htmlFor = check.id;
        title.append(el('span', '', `${index + 1}. ${task.title}`), el('span', 'study-minutes', `${day.minutes[index]} 分钟`));
        content.append(title, el('p', 'study-task-description', task.text || '按今天的课程完成本项练习。'));
        if (task.url) content.append(link(task.label, task.url));
        if (selected === 0 && index === 1) content.append(el('span', 'study-link-separator', ' · '), link('先读准备课', 'tutorial/chapters/00_start.html'));
        if (index === 3) content.append(el('span', 'study-link-separator', ' · '), link('回到本课练习与运行结果', day.url));
        if (task.answer !== undefined) {
          const details = el('details', 'study-answer');
          details.append(el('summary', '', '我已作答，展开参考答案'), el('p', '', task.answer));
          content.append(details);
        }
        if ((selected + 1) % 7 === 0 && index === 4) content.append(link('术语与闭卷自测', 'tutorial/chapters/18_glossary.html'));
        check.setAttribute('aria-label', `标记第 ${selected + 1} 天的“${task.title}”已完成，${day.minutes[index]} 分钟`);
        check.addEventListener('change', () => {
          const values = (state.done[day.id] || Array(5).fill(false)).slice();
          values[index] = check.checked;
          state.done[day.id] = values;
          row.classList.toggle('is-done', check.checked);
          persist();
          updateProgress();
        });
        row.append(check, content);
        taskList.append(row);
      });
      extra.replaceChildren();
      if (state.minutes === 90) {
        extra.append(el('p', 'study-small', '今日核心预算：10＋25＋15＋30＋10＝90 分钟。课程不删减；有余力可选择 120 或 150 分钟加练。'));
      } else {
        extra.append(el('h3', '', `额外 ${state.minutes - 90} 分钟 · 不替代核心任务`));
        extra.append(el('p', 'study-small', `总预算 ${core.totalMinutes(day, state.minutes)} 分钟；核心仍是 90 分钟。加练完成后写进笔记，不会自动算作核心打卡。`));
        const list = el('ol', 'study-extra-list');
        list.append(el('li', '', `加练一 · 30 分钟：${day.extra30}`));
        if (state.minutes === 150) list.append(el('li', '', `加练二 · 再用 30 分钟：${day.extra60}`));
        extra.append(list);
      }
      notes.value = state.notes[day.id] || '';
      noteCount.textContent = `${notes.value.length} / ${MAX_NOTE} 字符 · 对应第 ${selected + 1} 天。`;
      updateProgress();
    }

    duration.addEventListener('change', () => {
      const value = Number(duration.value);
      if (!ALLOWED_MINUTES.includes(value)) return;
      state.minutes = value;
      persist();
      renderDay();
      announce(`每日预算已改为 ${value} 分钟，课程内容和完成记录都保留。`);
    });
    chosenDate.addEventListener('change', () => {
      if (!core.validDate(chosenDate.value)) { announce('请选择有效日期。'); return; }
      const index = core.indexAt(state.start, chosenDate.value);
      if (index < 0 || index >= data.days.length) {
        chosenDate.value = core.dateAt(state.start, selected);
        announce('查看日期必须在当前计划范围内；计划结束后仍可选择范围内的日期补课。');
        return;
      }
      selectDay(index);
    });
    notes.addEventListener('input', () => {
      state.notes[data.days[selected].id] = notes.value;
      noteCount.textContent = `${notes.value.length} / ${MAX_NOTE} 字符 · 对应第 ${selected + 1} 天。`;
      persist();
    });
    importer.addEventListener('change', async () => {
      const file = importer.files && importer.files[0];
      if (!file) return;
      try {
        if (file.size > MAX_IMPORT_BYTES) throw new Error('文件超过 4 MiB，请选择本站导出的进度 JSON。');
        const text = await file.text();
        if (text.length > MAX_IMPORT_BYTES) throw new Error('文件内容过长。');
        const imported = validateProgress(JSON.parse(text), data, core);
        const done = data.days.filter(day => core.isComplete(imported.done[day.id])).length;
        if (!window.confirm(`导入文件包含 ${done} 天核心完成记录，开始日 ${imported.start}，每日 ${imported.minutes} 分钟。\n这会替换当前进度与笔记，不会合并。是否继续？`)) {
          announce('已取消导入，当前记录没有改变。');
          return;
        }
        state = imported;
        startDate.value = state.start;
        selected = clamp(core.indexAt(state.start, today.date));
        const saved = persist(true);
        renderDay();
        announce(saved ? '导入完成，进度与笔记已保存。' : '导入已显示，但本机保存失败；请立即导出备份，暂勿关闭页面。');
      } catch (error) {
        announce(`未导入，原有进度没有改变。${error instanceof SyntaxError ? '文件不是有效 JSON。' : error.message || '读取失败。'}`);
      } finally { importer.value = ''; }
    });
    function refreshDate() {
      const current = todayInfo();
      if (current.date === today.date) return;
      const followedToday = core.dateAt(state.start, selected) === today.date;
      today = current;
      if (followedToday) selected = clamp(core.indexAt(state.start, today.date));
      renderDay();
      announce('日期已更新；完成状态仍以你的手动勾选为准。');
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDate(); });
    setInterval(refreshDate, 60000);
    renderDay();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
