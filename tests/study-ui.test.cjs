/* 独立最小 DOM 测试，不启动浏览器；运行：node tests/study-ui.test.cjs */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/study-ui.js'), 'utf8');
const coreSource = fs.readFileSync(path.join(root, 'assets/study-core.js'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'tutorial/study/plan.json'), 'utf8'));
const core = require('../assets/study-core.js');
const ui = require('../assets/study-ui.js');

class Node {
  constructor(tag) {
    this.tag = tag; this.children = []; this.events = {}; this.attrs = {};
    this.hidden = false; this.value = ''; this.textContent = ''; this.className = '';
    this.classList = { toggle: (name, on) => {
      const parts = this.className.split(' ').filter(value => value && value !== name);
      if (on) parts.push(name);
      this.className = parts.join(' ');
    } };
  }
  append(...nodes) { for (const node of nodes) if (node) { node.parent = this; this.children.push(node); } }
  prepend(node) { node.parent = this; this.children.unshift(node); }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  removeAttribute(key) { delete this.attrs[key]; }
  addEventListener(type, fn) { (this.events[type] ??= []).push(fn); }
  async fire(type) { for (const fn of this.events[type] || []) await fn({ target: this }); }
  click() { return this.fire('click'); }
  focus() {}
  scrollIntoView() {}
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); }
}
const walk = node => [node, ...node.children.flatMap(walk)];
function app(page, storageThrows = false, date = '2026-10-26T04:00:00Z') {
  const host = new Node('main'), body = new Node('body');
  body.append(host);
  const saved = new Map();
  const document = {
    readyState: 'complete', hidden: false,
    currentScript: { src: 'https://example.test/course/assets/study-ui.js' }, body,
    createElement: tag => new Node(tag),
    querySelector: selector => selector === '.am-doc-body' ? host : null,
    getElementById: id => walk(body).find(node => node.id === id),
    addEventListener() {}
  };
  const RealDate = Date;
  class Clock extends RealDate { constructor(...args) { super(...(args.length ? args : [date])); } }
  const context = {
    document, location: new URL('https://example.test/course/' + page), URL, Date: Clock, Intl, Blob, console,
    setTimeout: fn => fn(), setInterval() {}, confirm: () => false,
    localStorage: {
      getItem: key => { if (storageThrows) throw Error('denied'); return saved.get(key) ?? null; },
      setItem: (key, value) => { if (storageThrows) throw Error('denied'); saved.set(key, value); }
    }
  };
  context.window = context;
  context.globalThis = context;
  context.AUDIO_STUDY_DATA = data;
  vm.createContext(context);
  vm.runInContext(coreSource, context);
  vm.runInContext(source, context);
  return { context, host, body, saved, find: id => walk(body).find(node => node.id === id), all: () => walk(body) };
}

async function main() {
  const base = { version: 1, start: data.start, minutes: 90,
    done: { d01: [true, false, false, false, false] }, notes: { d01: '中文笔记 <script>不会执行</script>' } };
  assert.deepEqual(ui.validateProgress(base, data, core), core.normalize(base, data));
  const invalid = [null, [], { ...base, version: 2 }, { ...base, extra: 'bad' },
    { ...base, start: '2026-02-30' }, { ...base, minutes: 180 }, { ...base, done: { d01: [true] } },
    { ...base, done: { d01: [1, false, false, false, false] } },
    { ...base, done: { d99: [false, false, false, false, false] } },
    { ...base, notes: { d01: 'x'.repeat(10001) } }, { ...base, notes: [] },
    { ...base, done: Object.fromEntries([['__proto__', []]]) }];
  for (const bad of invalid) assert.throws(() => ui.validateProgress(bad, data, core));

  const a = app('index.html');
  assert.ok(a.find('study-dashboard'));
  assert.equal(a.all().filter(node => node.type === 'checkbox').length, 5);
  assert.equal(a.find('study-heading').textContent, data.days[0].title, '首屏标题直接展示当天课题');
  const startLinks = a.all().find(node => node.className === 'study-start');
  assert.equal(startLinks.children.length, 2, '正文和视频并列，不能用视频替代正文');
  assert.ok(startLinks.children[0].href.endsWith(data.days[0].url));
  assert.ok(startLinks.children[1].href.includes(data.days[0].video));
  assert.ok(a.all().some(node => node.textContent === '先读准备课'));
  const dashboard = a.find('study-dashboard');
  const focusIndex = dashboard.children.findIndex(node => node.className === 'study-focus');
  const headingIndex = dashboard.children.findIndex(node => node.id === 'study-heading');
  assert.equal(focusIndex, headingIndex + 1, '当天主题紧跟标题，不埋在控制区下方');
  assert.equal(a.all().find(node => node.className === 'study-note-section').open, false, '笔记默认收起');
  assert.notEqual(a.all().find(node => node.className === 'study-date-tools').open, true, '日期选择默认收起');
  assert.notEqual(a.all().find(node => node.className === 'study-settings').open, true, '备份设置默认收起');
  assert.equal(a.all().some(node => node.className === 'study-quicklinks'), false, '首页不重复显示工具导航');
  const controls = a.all().find(node => node.className === 'study-controls');
  assert.equal(controls.children.length, 2, '常驻日常控制只有预算与补课');
  const resources = a.all().filter(node => node.attrs['data-study-resource'] === 'true');
  assert.ok(resources.length >= 5, '课程、准备课、视频和实验仍可达');
  assert.ok(resources.some(node => node.textContent === '对照代码与图' && node.attrs['data-study-kind'] === 'course'));
  assert.ok(resources.some(node => node.textContent === '开始本课视频' && node.attrs['data-study-kind'] === 'video'));
  assert.ok(resources.some(node => node.textContent === '做实验' && node.attrs['data-study-kind'] === 'lab'));
  const check = a.all().find(node => node.type === 'checkbox');
  check.checked = true;
  await check.fire('change');
  assert.equal(JSON.parse([...a.saved.values()][0]).done.d01[0], true);
  const budget = a.find('study-duration');
  budget.value = '120'; await budget.fire('change');
  assert.equal(a.all().find(node => node.className === 'study-extra-list').children.length, 1);
  budget.value = '150'; await budget.fire('change');
  const extra = a.all().find(node => node.className === 'study-extra-list');
  assert.equal(extra.children.length, 2);
  assert.ok(extra.children[1].textContent.includes('再用 30 分钟'));
  const notes = a.find('study-notes');
  notes.value = '<img src=x onerror=alert(1)>';
  await notes.fire('input');
  assert.equal(JSON.parse([...a.saved.values()][0]).notes.d01, notes.value);
  const before = [...a.saved.values()][0];
  const file = a.find('study-import');
  file.files = [{ size: 3, text: async () => '{x}' }];
  await file.fire('change');
  assert.equal([...a.saved.values()][0], before, '坏 JSON 不覆盖现有数据');
  file.files = [{ size: before.length, text: async () => before }];
  await file.fire('change');
  assert.equal([...a.saved.values()][0], before, '用户取消导入不改变数据');
  a.context.confirm = () => true;
  const complete = { ...base, done: Object.fromEntries(data.days.map(day => [day.id, Array(5).fill(true)])) };
  const serialized = JSON.stringify(complete);
  file.files = [{ size: serialized.length, text: async () => serialized }];
  await file.fire('change');
  assert.equal(a.all().find(node => node.className === 'study-success').hidden, false);
  assert.equal(core.nextPending(JSON.parse([...a.saved.values()][0]), data), -1);

  const plan = app('tutorial/study/plan.html');
  assert.equal(plan.all().filter(node => node.className === 'study-week').length, 11);
  assert.equal(plan.all().filter(node => node.className === 'study-day-button').length, 77);
  assert.ok(plan.all().some(node => node.className === 'study-quicklinks'), '独立计划页仍有返回入口');
  const browseDay = app('index.html');
  await browseDay.all().find(node => node.textContent === '后一天 →').click();
  assert.equal(browseDay.find('study-heading').textContent, data.days[1].title);
  assert.ok(browseDay.all().find(node => node.className === 'study-kicker').textContent.includes('第 2 天'));
  await browseDay.all().find(node => node.textContent === '补最早未完成').click();
  assert.equal(browseDay.find('study-heading').textContent, data.days[0].title);
  const seventh = app('index.html?day=d07');
  assert.ok(seventh.all().some(node => node.textContent === '术语与闭卷自测'));
  const other = app('tutorial/chapters/08_aec.html');
  assert.equal(other.find('study-dashboard'), undefined);
  const blocked = app('index.html', true);
  assert.equal(blocked.all().find(node => node.className === 'study-warning').hidden, false);
  const late = app('index.html', false, '2027-01-20T04:00:00Z');
  assert.ok(late.all().find(node => node.className === 'study-calendar-status').textContent.includes('仍可补课'));
  const early = app('index.html', false, '2026-10-25T04:00:00Z');
  assert.ok(early.all().find(node => node.className === 'study-calendar-status').textContent.includes('距离开始还有'));
  assert.equal(source.includes('innerHTML'), false);
  const formalUrls = new Set(data.days.map(day => day.url));
  formalUrls.add('tutorial/chapters/00_start.html');
  formalUrls.add('tutorial/chapters/18_glossary.html');
  const chapters = fs.readdirSync(path.join(root, 'tutorial/chapters')).filter(file => /^\d\d_.*\.html$/.test(file));
  assert.equal(chapters.length, 19);
  for (const chapter of chapters) assert.ok(formalUrls.has('tutorial/chapters/' + chapter), '正式计划缺少 ' + chapter);
  console.log('PASS: 12 类坏导入、5 项打卡、120/150 档位、笔记、取消与完成导入、11 周 77 天、19 章可达、页面限定、存储失败、计划前后补课。');
  console.log('PASS: 主题位置、默认收起、精简首页控制、资源种类标记、独立计划页入口、日期切换与补课。');
  console.log('范围：独立最小 DOM 与数据校验，不代表真实浏览器视觉验收。');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
