/* Coverage/evidence and resume-version contract; not human comprehension or device QA. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const base = 'tutorial/video-lessons/';
const audit = JSON.parse(read(base+'depth-audit.json'));
assert.equal(audit.length, 23);
for (const entry of audit) {
  assert.ok(entry.expandedScenes > entry.originalScenes + 8, entry.id);
  assert.ok(entry.coverage.length >= 4, entry.id);
  assert.ok(entry.coverage.every(s => s.heading && s.explanationSegments > 0), entry.id);
  const record = JSON.parse(read(base+`media/${entry.id}/lesson.json`));
  assert.equal(record.scenes.length, entry.expandedScenes);
  assert.deepEqual(record.coverage, entry.coverage.map(s => s.heading));
  const narration = record.captions.map(c => c.text).join('');
  assert.doesNotMatch(narration, /小于等于ft|教材公式中的对应量|\\(?:frac|left|right|mathrm)/);
  assert.ok(record.scenes.some(s => s.kind === 'detail'));
  assert.match(read(base+entry.id+'.html'), /captions\.vtt\?v=20261027-depth/);
  if (entry.newModelRun) {
    assert.ok(record.scenes.some(s => s.kind === 'terminal'));
    assert.match(read(base+entry.id+'.html'), new RegExp('depth-assets/'+entry.id+'-run.json'));
    assert.match(read(base+entry.id+'.html'), /project_demo\.py/);
  }
}
const gt = JSON.parse(read(base+'depth-assets/gtcrn-run.json'));
assert.equal(gt.input_samples, gt.output_samples);
assert.equal(gt.irregular_max_abs_difference, 0);
assert.match(gt.scope, /短演示/);
const conv = JSON.parse(read(base+'depth-assets/convtasnet-run.json'));
assert.deepEqual(conv.shapes.encoder, [1,512,4731]);
assert.deepEqual(conv.output_shape, [2,37840]);
assert.match(conv.model, /不是用户微调权重/);
const zip = JSON.parse(read(base+'depth-assets/zipformer-run.json'));
assert.equal(zip.result.tokens.length, zip.result.log_probs.length);
assert.equal(zip.result.tokens.length, zip.result.timestamps.length);
const training = JSON.parse(read(base+'depth-assets/neural-run.json'));
assert.equal(training['历史'].length, 17);
assert.ok(training['CTC']['梯度有限']);
assert.match(training['限制'], /合成数据/);

// A previous edit's resume point is preserved but not reused for new timings.
function node(extra={}) { return Object.assign({dataset:{},events:{},addEventListener(k,f){this.events[k]=f},setAttribute(){},querySelectorAll(){return []}},extra); }
const previous = 'yang-audio-video-v2:/tutorial/video-lessons/08.html';
const store = new Map([[previous,'123'],['yang-audio-study-v1:demo','unchanged']]);
const video=node({dataset:{revision:'20261027-depth'},readyState:1,duration:3000,currentTime:0,playbackRate:1});
const status=node();
vm.runInNewContext(read(base+'player.js'), {URL,Number,Math,Promise,
  location:new URL('https://example.test/tutorial/video-lessons/08.html'),
  localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},
  document:{body:{classList:{add(){}}},getElementById:id=>id==='lesson-video'?video:id==='play-status'?status:undefined,querySelectorAll:()=>[]}
});
video.events.loadedmetadata();
assert.equal(video.currentTime,0);
video.currentTime=20; video.events.timeupdate();
assert.equal(store.get(previous),'123');
assert.equal(store.get(previous+':20261027-depth'),'20');
assert.equal(store.get('yang-audio-study-v1:demo'),'unchanged');
console.log('PASS depth: 23 section maps, specific real-run evidence, narration hygiene, new video resume revision, unchanged learning checks.');
