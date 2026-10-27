/* Static course-hub contract; no browser/media playback assertions. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'tutorial/study/videos.html');
const page = fs.readFileSync(pagePath, 'utf8');
const ctx = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'assets/video-catalog.js'), 'utf8'), ctx);
assert.match(page, /<h1>图文与视频，都在这里。<\/h1>/);
assert.match(page, /完整图文课程/);
assert.equal((page.match(/class="library-item"/g) || []).length, 23);
for (const lesson of ctx.window.AUDIO_VIDEO_LESSONS) {
  const row = page.match(new RegExp(`<article class="library-item" data-lesson="${lesson.id}">([\\s\\S]*?)</article>`));
  assert.ok(row, lesson.id + ' must have a course row');
  assert.ok(row[1].includes(`href="../../${lesson.source}"`), lesson.id + ' full original text');
  assert.ok(row[1].includes(`href="../../${lesson.url}?v=20261027-depth"`), lesson.id + ' matched video with current cache version');
  assert.match(row[1], />读图文<\/a>/);
  assert.match(row[1], />看视频<\/a>/);
}
assert.doesNotMatch(page, /<script\b/, 'the directory works without JavaScript');
for (const match of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (/^(https?:|mailto:|data:|#)/.test(match[1])) continue;
  const file = path.resolve(path.dirname(pagePath), decodeURIComponent(match[1].split(/[?#]/)[0]));
  assert.ok(file.startsWith(root + path.sep), 'link stays in site');
  assert.ok(fs.existsSync(file), 'missing local link: ' + match[1]);
}
let insideAnchor = false;
for (const match of page.matchAll(/<\/?a(?:\s[^>]*|)>/g)) {
  if (match[0].startsWith('</')) { assert.ok(insideAnchor); insideAnchor = false; }
  else { assert.equal(insideAnchor, false, 'no nested anchors'); insideAnchor = true; }
}
assert.equal(insideAnchor, false);
for (const url of ['videos/foundations.html', 'videos/workflow.html', '../projects/gtcrn/video.html', '../projects/convtasnet/video.html', '../projects/zipformer/video.html', '../resources.html']) {
  assert.ok(page.includes(`href="${url}"`), 'legacy link preserved: ' + url);
}
console.log('PASS course entry: 23 paired full-text/video links, no missing local assets or nested anchors, no-JS access, legacy materials retained.');
