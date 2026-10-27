/*
 * Portal integration regression tests using a deliberately small, local DOM.
 * Runs the real portal.js and course/study data. The existing dashboard and
 * iframe documents are fixtures: no browser, CSS layout, networking or codecs.
 * Run: node tests/portal-dom.test.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const base = 'https://yang07-29.github.io/yang-audio/';
const source = fs.readFileSync(path.join(root, 'assets/portal.js'), 'utf8');

class Event {
  constructor(type, target, extra = {}) {
    Object.assign(this, { type, target, button: 0, defaultPrevented: false, stopped: false,
      ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, extra);
  }
  preventDefault() { this.defaultPrevented = true; }
  stopPropagation() { this.stopped = true; }
}
function matches(node, selector) {
  return selector.split(',').some(part => {
    const text = part.trim();
    const attr = text.match(/\[([^=\]]+)(?:="([^"]*)")?\]$/);
    const stem = attr ? text.slice(0, attr.index) : text;
    if (stem.startsWith('.') && !node.classList.contains(stem.slice(1))) return false;
    if (stem.startsWith('#') && node.id !== stem.slice(1)) return false;
    if (stem && !/^[.#]/.test(stem) && node.tagName !== stem.toLowerCase()) return false;
    return !attr || (node.hasAttribute(attr[1]) && (attr[2] === undefined || node.getAttribute(attr[1]) === attr[2]));
  });
}
class Node {
  constructor(tag, doc) {
    this.tagName = tag; this.ownerDocument = doc; this.children = []; this.parentNode = null;
    this.attrs = {}; this.events = {}; this.dataset = {}; this.className = ''; this.id = '';
    this.hidden = false; this.open = false; this._text = ''; this.target = '';
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); },
      toggle: (name, on) => {
        const value = on === undefined ? !this.classList.contains(name) : on;
        value ? this.classList.add(name) : this.classList.remove(name); return value;
      }
    };
  }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.replaceChildren(); }
  get href() { return this.attrs.href ? new URL(this.attrs.href, this.ownerDocument.location.href).href : ''; }
  set href(value) { this.attrs.href = String(value); }
  get origin() { return this.href ? new URL(this.href).origin : ''; }
  get isConnected() { return this === this.ownerDocument || Boolean(this.parentNode?.isConnected); }
  append(...nodes) {
    for (const node of nodes) { node.remove(); node.parentNode = this; this.children.push(node); }
  }
  prepend(...nodes) {
    for (const node of nodes.slice().reverse()) { node.remove(); node.parentNode = this; this.children.unshift(node); }
  }
  replaceChildren(...nodes) {
    for (const child of this.children) child.parentNode = null;
    this.children = []; this.append(...nodes);
  }
  remove() {
    if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(node => node !== this);
    this.parentNode = null;
  }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return Object.hasOwn(this.attrs, key) ? this.attrs[key] : null; }
  hasAttribute(key) { return Object.hasOwn(this.attrs, key); }
  removeAttribute(key) { delete this.attrs[key]; }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [...(matches(child, selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return matches(this, selector) ? this : this.parentNode?.closest(selector) || null; }
  addEventListener(type, callback, options = false) {
    (this.events[type] ??= []).push({ callback, capture: options === true || options?.capture === true });
  }
  fire(type, extra = {}) {
    const event = new Event(type, this, extra), ancestors = [];
    for (let node = this.parentNode; node; node = node.parentNode) ancestors.push(node);
    const invoke = (node, capture) => {
      for (const listener of node.events[type] || []) if (listener.capture === capture) listener.callback(event);
    };
    for (const node of ancestors.slice().reverse()) { invoke(node, true); if (event.stopped) return event; }
    invoke(this, true); invoke(this, false);
    if (!event.stopped) for (const node of ancestors) { invoke(node, false); if (event.stopped) break; }
    return event;
  }
  click(extra) { return this.fire('click', extra); }
  focus() { this.ownerDocument.activeElement = this; }
  scrollIntoView() { this.scrolledIntoView = true; }
}
class Document extends Node {
  constructor(location) {
    super('#document'); this.ownerDocument = this; this.location = location; this.readyState = 'complete';
    this.head = this.createElement('head'); this.body = this.createElement('body');
    this.append(this.head, this.body); this.title = 'Fixture document';
  }
  createElement(tag) { return new Node(tag.toLowerCase(), this); }
  getElementById(id) { return this.querySelector('#' + id); }
}
function app(initialHash = '') {
  const listeners = {}, pending = [], timers = new Map(); let timerId = 0;
  let address = new URL('index.html' + initialHash, base);
  const location = {};
  for (const field of ['href', 'pathname', 'search', 'origin', 'protocol', 'hash']) {
    Object.defineProperty(location, field, {
      get: () => address[field],
      set(value) {
        const previous = address.href;
        if (field === 'href') address = new URL(value, address); else address[field] = value;
        if (address.href !== previous && field === 'hash') pending.push(() => {
          for (const callback of listeners.hashchange || []) callback();
        });
      }
    });
  }
  const document = new Document(location), header = document.createElement('header'); header.className = 'am-head';
  const heading = document.createElement('h1'), subtitle = document.createElement('p'); subtitle.className = 'am-sub';
  header.append(heading, subtitle);
  const body = document.createElement('main'); body.className = 'am-doc-body';
  const dashboard = document.createElement('section'); dashboard.id = 'study-dashboard';
  const check = document.createElement('input'); check.type = 'checkbox'; check.checked = true;
  const note = document.createElement('textarea'); note.value = '保留原来的学习笔记';
  let checkChanges = 0; check.addEventListener('change', () => checkChanges++);
  const course = document.createElement('a'); course.href = base + 'tutorial/chapters/01_sound.html'; course.textContent = '阅读课程';
  const video = document.createElement('a'); video.href = base + 'tutorial/projects/gtcrn/video.html'; video.textContent = '看讲解';
  dashboard.append(check, note, course, video); body.append(dashboard);
  const panels = Array.from({ length: 5 }, (_, index) => {
    const node = document.createElement('section'); node.className = 'am-panel'; node.id = `panel-${index}`;
    node.textContent = `原有正文 ${index}`; body.append(node); return node;
  });
  document.body.append(header, body);
  document.currentScript = { src: base + 'assets/portal.js' };
  const context = {
    document, location, URL, console,
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
    addEventListener: (type, callback) => (listeners[type] ??= []).push(callback)
  };
  context.window = context; vm.createContext(context);
  for (const name of ['course-data.js', 'study-data.js', 'video-catalog.js']) vm.runInContext(fs.readFileSync(path.join(root, 'assets', name), 'utf8'), context);
  vm.runInContext(source, context);
  const flush = () => { while (pending.length) pending.shift()(); };
  return { context, document, location, dashboard, check, note, course, video, panels, flush,
    get checkChanges() { return checkChanges; }, find: id => document.getElementById(id),
    click(node, extra) { const event = node.click(extra); flush(); return event; },
    route(hash) { location.hash = hash; flush(); },
    loadFrame(resource) {
      const frame = document.querySelector('iframe');
      const doc = new Document(new URL(resource, base));
      const title = doc.createElement('h1'); title.textContent = '实际课程标题'; doc.body.append(title);
      frame.contentDocument = doc; frame.contentWindow = { location: doc.location }; frame.fire('load');
      return doc;
    }
  };
}

const a = app();
assert.equal(a.find('learn-today').hidden, false, '默认今日可见');
assert.equal(a.dashboard.parentNode, a.find('learn-today'), '移动真实 dashboard 而不是克隆');
for (const id of ['learn-catalog', 'learn-projects', 'learn-resources', 'portal-reader']) assert.equal(a.find(id).hidden, true, id);
const guide = a.find('learn-guide');
assert.equal(guide.open, false, '学习说明默认收起');
assert.deepEqual(guide.querySelectorAll('.am-panel'), a.panels, '五块原内容及顺序全部保留');
const sameDocument = a.location.href.split('#')[0];
for (const id of ['learn-catalog', 'learn-projects']) {
  const tab = a.document.querySelectorAll('.portal-mobile-tab').find(node => node.dataset.portalView === id);
  assert.equal(a.click(tab).defaultPrevented, true);
  assert.equal(a.location.href.split('#')[0], sameDocument, '切换栏目不跳离当前文档');
  assert.equal(a.find(id).hidden, false);
  assert.equal(a.find('learn-today').hidden, true);
}
a.route('#learn-today');
assert.equal(a.click(a.course).defaultPrevented, true);
assert.ok(a.location.hash.startsWith('#read='));
assert.equal(a.find('portal-reader').hidden, false);
assert.equal(a.find('portal-views').hidden, true);
const frame = a.document.querySelector('iframe');
assert.equal(frame.src, base + 'tutorial/chapters/01_sound.html?embedded=1');
a.loadFrame(frame.src);
assert.equal(a.document.querySelector('.portal-reader-title').textContent, '实际课程标题');
assert.ok(a.document.querySelectorAll('.portal-reader-tab').some(node => node.href === base + 'tutorial/video-lessons/01.html?v=20261027'), '第01课的视频必须指向01并加载当前播放器，不是基础概览');
a.click(a.document.querySelector('.portal-button'));
assert.equal(a.find('portal-reader').hidden, true);
assert.equal(a.dashboard.parentNode, a.find('learn-today'));
assert.equal(a.check.checked, true); assert.equal(a.note.value, '保留原来的学习笔记');
a.check.fire('change'); assert.equal(a.checkChanges, 1, '原节点事件处理器保留');
assert.equal(a.document.activeElement, a.course, '返回后焦点恢复到课程入口');

// iframe 首页、首页别名和下一个文档都交给父路由，不生成嵌套首页。
for (const [destination, expectedHash] of [
  ['index.html', '#learn-today'], ['tutorial/index.html', '#learn-today'], ['index.html#learn-catalog', '#learn-catalog']
]) {
  a.route('#learn-today'); a.click(a.course);
  const doc = a.loadFrame(frame.src), home = doc.createElement('a'); home.href = base + destination; doc.body.append(home);
  let bubbled = false; doc.addEventListener('click', () => { bubbled = true; });
  const event = home.click(); a.flush();
  assert.equal(event.defaultPrevented, true); assert.equal(event.stopped, true);
  assert.equal(bubbled, false, 'capture 代理阻止旧 embedded 点击处理器');
  assert.equal(a.location.hash, expectedHash); assert.equal(a.find('portal-reader').hidden, true);
}
a.route('#learn-today'); a.click(a.course);
let doc = a.loadFrame(frame.src);
const next = doc.createElement('a'); next.href = base + 'tutorial/chapters/02_digital.html'; doc.body.append(next);
assert.equal(next.click().defaultPrevented, true); a.flush();
assert.ok(decodeURIComponent(a.location.hash).includes('02_digital.html'));
doc = a.loadFrame(frame.src);
assert.ok(a.document.querySelectorAll('.portal-reader-tab').some(node => node.href === base + 'tutorial/video-lessons/02.html?v=20261027'), '下一课切换到独立02视频并更新缓存版本');
const anchor = doc.createElement('a'); anchor.href = doc.location.href + '#panel-A'; doc.body.append(anchor);
assert.equal(anchor.click().defaultPrevented, false, '同文档小节原生滚动');
const outside = doc.createElement('a'); outside.href = 'https://example.org/manual'; doc.body.append(outside);
assert.equal(outside.click().defaultPrevented, false, '不接管外站导航');

// 使用与有声播放器一致的 aria-label 和独立 playing 状态模拟其暂停入口。
a.route('#learn-today'); a.click(a.video); doc = a.loadFrame(frame.src);
let playing = true, toggleCount = 0, audioPauses = 0;
const toggle = doc.createElement('button'); toggle.setAttribute('data-amv', 'toggle');
toggle.setAttribute('aria-label', '暂停'); toggle.textContent = '❚❚';
toggle.addEventListener('click', () => {
  toggleCount++; playing = !playing;
  toggle.setAttribute('aria-label', playing ? '暂停' : '播放'); toggle.textContent = playing ? '❚❚' : '▶';
});
const audio = doc.createElement('audio'); audio.pause = () => audioPauses++;
doc.body.append(toggle, audio);
a.click(a.document.querySelector('.portal-button'));
assert.equal(playing, false, '离开阅读区调用播放器自身暂停，停止内部状态');
assert.equal(toggleCount, 1); assert.ok(audioPauses >= 1, '同时兜底暂停媒体');
a.click(a.video);
assert.equal(toggleCount, 1, '再次打开已暂停视频不能误触播放');
assert.equal(playing, false); assert.equal(a.find('portal-reader').hidden, false);

const deepLink = app('#learn-projects');
assert.equal(deepLink.find('learn-projects').hidden, false, '直接栏目书签能打开');
const rows = deepLink.document.querySelectorAll('.portal-course-row');
assert.equal(rows.length, 19, '目录保留全部 19 课');
for (const row of rows) {
  const choices = row.querySelectorAll('.portal-choice');
  assert.equal(choices.length, 2, '每课都有图文和视频两个独立入口');
  assert.equal(choices[0].textContent, '读图文');
  assert.equal(choices[1].textContent, '看视频');
}
const readLink = app('#read=' + encodeURIComponent('tutorial/chapters/08_aec.html'));
assert.equal(readLink.find('portal-reader').hidden, false, '直接阅读书签能打开');
const videoLink = app('#read=' + encodeURIComponent('tutorial/video-lessons/08.html'));
assert.equal(videoLink.document.querySelector('iframe').src, base + 'tutorial/video-lessons/08.html?v=20261027&embedded=1', '直接旧书签也使用当前视频播放器');
assert.equal(videoLink.document.querySelector('.portal-standalone').href, base + 'tutorial/video-lessons/08.html?v=20261027', '独立打开使用当前播放器');
assert.ok(videoLink.document.querySelectorAll('.portal-reader-tab').some(node => node.href === base + 'tutorial/chapters/08_aec.html'), '从AEC视频能切回AEC正文');
const invalid = app('#read=' + encodeURIComponent('tutorial/%2e%2e%2f..%2foutside.html'));
assert.equal(invalid.find('learn-today').hidden, false, '异常路径回到安全的今日视图');
assert.equal(invalid.find('portal-reader').hidden, true);
console.log('PASS portal DOM: 今日入口、五块正文保留、栏目切换、内嵌阅读/返回、原节点状态与事件、iframe 首页/别名/下一课、锚点、媒体暂停、深链接与非法路径。');
console.log('范围：真实 portal.js + 最小 DOM/iframe/播放器 fixture；不代表浏览器布局、CSS 可见性、真实网络或音频播放验收。');
