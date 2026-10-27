/* Structural/design-token checks, not a substitute for real browser layout QA. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const css = read('assets/handbook.css');
const context = { window: {} };
vm.runInNewContext(read('assets/video-catalog.js'), context);
const catalog = context.window.AUDIO_VIDEO_LESSONS;
assert.equal(catalog.length, 23);
for (const item of catalog) {
  const html = read(item.url);
  assert.match(html, /<body class="handbook">/);
  assert.match(html, /assets\/handbook\.css\?v=20261027/);
  assert.ok(html.includes(item.source), `${item.id}: full text must remain reachable`);
  assert.match(html, /<video[^>]+controls/);
  assert.ok(html.includes('lesson.webm') && html.includes('lesson.mp4'));
  assert.ok(html.includes('逐字讲稿') && html.includes('实际输出'));
}
assert.match(read('tutorial/study/videos.html'), /<body class="handbook">/);
assert.ok(read('assets/course.js').indexOf("new URL('handbook.css") > read('assets/course.js').indexOf("new URL('course-shell.css"));
assert.ok(read('assets/study-ui.js').includes('yang-audio-study-v1:'));
assert.ok(read('assets/course.js').includes('audio-course-progress-v4'));
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /focus-visible/);
assert.match(css, /min-height: 44px/);
assert.match(css, /minmax\(0, 1fr\)/);
assert.doesNotMatch(css, /@import|https?:\/\/|linear-gradient|backdrop-filter/);
const colors = Object.fromEntries([...css.matchAll(/--hb-(paper|ink|muted|accent|tint|soft):\s*(#[0-9a-f]{6})/g)].map(m => [m[1],m[2]]));
function luminance(hex) {
  const c = hex.slice(1).match(/../g).map(x => parseInt(x,16)/255).map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
  return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function contrast(a,b) { const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
for (const fg of ['ink','muted','accent']) for (const bg of ['paper','tint','soft']) {
  assert.ok(contrast(colors[fg], colors[bg]) >= 4.5, `${fg} / ${bg} must meet normal text AA`);
}
assert.ok(contrast('#ffffff',colors.accent)>=4.5);
console.log('PASS handbook: 23 text/video pairs, shared CSS, playback sources, unchanged storage keys, reduced motion, keyboard focus, AA core text colors. Layout still requires browser inspection.');
