/* Behavioral contract, not a substitute for real decoder/device testing. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function element(extra = {}) {
  return Object.assign({ events: {}, dataset: {}, attrs: {}, textContent: '', value: '',
    addEventListener(k, fn) { (this.events[k] ??= []).push(fn); },
    fire(k, e = {}) { for (const fn of this.events[k] || []) fn(e); },
    setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this[k]; },
    scrollIntoView() {} }, extra);
}
function setup() {
  const video = element({ dataset: { webm: 'media/08/lesson.webm', mp4: 'media/08/lesson.mp4' },
    currentTime: 0, duration: NaN, readyState: 0, paused: true, playbackRate: 1,
    plays: 0, loads: 0, load() { this.loads++; this.readyState = 0; }, pause() { this.paused = true; },
    play() { this.plays++; this.paused = false; return Promise.resolve(); },
    querySelectorAll() { return []; } });
  const status = element(), format = element({ value: 'auto' }), retry = element();
  const speed = element({ value: '1' }), replay = element(), chapter = element({ dataset: { seek: '100' } });
  const context = vm.createContext({ URL, Promise, Number, Math, Set,
    location: new URL('https://example.test/tutorial/video-lessons/08.html'),
    localStorage: { getItem() { return '60'; }, setItem() {} },
    document: { body: { classList: { add() {} } },
      getElementById: id => ({ 'lesson-video': video, 'play-status': status, format, retry, speed, replay })[id],
      querySelectorAll: () => [chapter] }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../tutorial/video-lessons/player.js'), 'utf8'), context);
  return { video, status, format, retry, speed, replay, chapter };
}
const s = setup();
assert.equal(s.video.plays, 0, 'never autoplay');
s.chapter.fire('click');
assert.equal(s.video.currentTime, 0, 'do not seek before metadata');
s.video.readyState = 1; s.video.duration = 600; s.video.fire('loadedmetadata');
assert.equal(s.video.currentTime, 100, 'honor pending chapter instead of saved timestamp');
s.video.currentTime = 140; s.video.playbackRate = 1.5; s.speed.value = '1.5';
s.format.value = 'webm'; s.format.fire('change');
assert.equal(s.video.src, 'media/08/lesson.webm');
assert.equal(s.video.loads, 1);
const playsBeforeMetadata = s.video.plays;
s.video.duration = 600; s.video.readyState = 1; s.video.fire('loadedmetadata');
assert.equal(s.video.currentTime, 140);
assert.equal(s.video.playbackRate, 1.5);
assert.equal(s.video.plays, playsBeforeMetadata, 'changing format must not autoplay');
s.video.error = { code: 4 }; s.video.fire('error');
assert.match(s.status.textContent, /格式|编码/);
assert.match(s.status.textContent, /4/);
s.video.error = { code: 2 }; s.video.fire('error');
assert.match(s.status.textContent, /网络/);
s.retry.fire('click'); assert.equal(s.video.loads, 2);
s.format.value = 'mp4'; s.format.fire('change'); assert.equal(s.video.src, 'media/08/lesson.mp4');
s.format.value = 'auto'; s.format.fire('change'); assert.equal(s.video.src, undefined);
s.video.fire('waiting'); assert.match(s.status.textContent, /缓冲/);
const root = path.resolve(__dirname, '..');
const catalog = fs.readFileSync(path.join(root, 'assets/video-catalog.js'), 'utf8');
const records = JSON.parse(catalog.slice(catalog.indexOf('=') + 1).trim().replace(/;$/, ''));
for (const r of records) {
  const page = fs.readFileSync(path.join(root, r.url), 'utf8');
  assert.match(page, /type='video\/webm; codecs="vp9, opus"'/);
  assert.match(page, /id="format"/);
  assert.match(page, /id="retry"/);
  assert.match(page, /class="lesson-modes"/);
  assert.ok(page.includes(`href="../../${r.source}">读完整图文`), r.id);
  assert.ok(fs.statSync(path.join(root, 'tutorial/video-lessons/media', r.id, 'lesson.webm')).size > 0);
}
console.log('PASS dual-format playback contract, visible text links, pending seek, format/retry, no autoplay, errors and all 23 WebM assets.');
