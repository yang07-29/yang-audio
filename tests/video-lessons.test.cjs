/* Static data, routing and native-player contract. Not browser/codec QA. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const file of ['course-data.js', 'study-data.js', 'video-catalog.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'assets', file), 'utf8'), context);
}
const videos = context.window.AUDIO_VIDEO_LESSONS;
const expected = [...Array(19)].map((_, i) => String(i).padStart(2,'0')).concat(['convtasnet','gtcrn','speechllm','zipformer']).sort();
assert.deepEqual(Array.from(videos, v => v.id).sort(), expected);
assert.equal(new Set(videos.map(v=>v.url)).size, 23);
assert.equal(new Set(videos.map(v=>v.source)).size, 23);
for (const video of videos) {
  assert.ok(fs.existsSync(path.join(root, video.source)), video.source);
  const page = fs.readFileSync(path.join(root, video.url), 'utf8');
  assert.match(page, /<video[^>]+controls[^>]+playsinline/);
  assert.doesNotMatch(page, /\bautoplay\b/);
  assert.match(page, /captions\.vtt/);
  assert.match(page, /逐字讲稿/);
  const media = path.join(root, 'tutorial/video-lessons/media', video.id);
  const record = JSON.parse(fs.readFileSync(path.join(media, 'lesson.json'), 'utf8'));
  assert.ok(record.narrationChineseCharacters >= 1300);
  assert.ok(record.duration >= 240 && record.duration < 1500, video.id+' duration');
  assert.ok(record.scenes.length >= 10);
  assert.ok(record.scenes.some(s=>s.kind==='code'));
  assert.ok(record.scenes.some(s=>s.kind==='result'));
  for (const file of ['lesson.mp4','poster.jpg','result.png','example.py','output.txt','captions.vtt']) assert.ok(fs.statSync(path.join(media,file)).size>0);
  const mp4 = fs.readFileSync(path.join(media,'lesson.mp4'));
  assert.ok(mp4.includes(Buffer.from('ftyp')));
  assert.ok(mp4.indexOf(Buffer.from('moov')) < mp4.indexOf(Buffer.from('mdat')), 'faststart: '+video.id);
  assert.equal(mp4.length, video.bytes);
  assert.ok(video.bytes<95*1024*1024);
  assert.match(fs.readFileSync(path.join(media,'example.py'),'utf8'), /#[^\n]*[\u4e00-\u9fff]/);
  let end=0;
  for (const caption of record.captions) {
    assert.ok(caption.start>=end-.005);
    assert.ok(caption.end>caption.start);
    end=caption.end;
  }
  assert.ok(Math.abs(end-record.duration)<.05);
}
for (const lesson of context.window.AUDIO_COURSE.lessons) {
  assert.equal(videos.filter(v=>v.source===lesson.url).length,1);
}
for (const day of context.window.AUDIO_STUDY_DATA.days) {
  const paired=videos.find(v=>v.source===day.url);
  assert.ok(paired,day.url);
  assert.equal(day.video,paired.url, 'Wrong daily video: '+day.id);
  assert.doesNotMatch(day.video,/foundations|workflow/);
}
console.log('PASS video lessons: 23 independent MP4s, 19 chapter and 77 day mappings, annotated examples/results, synchronized captions, faststart and source links.');
