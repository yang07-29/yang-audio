/* Native-player glue in a minimal DOM; this does not emulate browser codecs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function node(extra={}) {
  return Object.assign({events:{},dataset:{},attrs:{},textContent:'',
    addEventListener(name,fn){(this.events[name]??=[]).push(fn)},
    fire(name,event={}){for(const fn of this.events[name]||[])fn(event)},
    setAttribute(k,v){this.attrs[k]=v},scrollIntoView(){}},extra);
}
const video=node({currentTime:0,duration:500,readyState:1,playbackRate:1,plays:0,querySelectorAll(){return []},play(){this.plays++;return Promise.resolve()}});
const status=node(), speed=node(), replay=node();
const chapter0=node({dataset:{seek:'0'}}),chapter1=node({dataset:{seek:'100'}});
const transcript=node({dataset:{seek:'100'}});
const store=new Map([['yang-audio-video-v2:/yang-audio/tutorial/video-lessons/01.html','60']]);
const classes=new Set();
const context=vm.createContext({URL,Promise,Number,Math,
  location:new URL('https://yang07-29.github.io/yang-audio/tutorial/video-lessons/01.html?embedded=1'),
  localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},
  document:{body:{classList:{add:n=>classes.add(n)}},
    getElementById:id=>({'lesson-video':video,'play-status':status,speed,replay}[id]),
    querySelectorAll:selector=>selector==='.chapters [data-seek]'?[chapter0,chapter1]:[chapter0,chapter1,transcript]}
});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../tutorial/video-lessons/player.js'),'utf8'),context);
assert.ok(classes.has('embedded'));
assert.equal(video.plays,0,'must not autoplay');
video.fire('loadedmetadata');assert.equal(video.currentTime,60);
chapter1.fire('click');assert.equal(video.currentTime,100);assert.equal(video.plays,1);
video.fire('timeupdate');assert.equal(chapter1.attrs['aria-current'],'true');assert.equal(chapter0.attrs['aria-current'],'false');
assert.equal(store.values().next().value,'100');
speed.fire('change',{target:{value:'1.25'}});assert.equal(video.playbackRate,1.25);
replay.fire('click');assert.equal(video.currentTime,90);
video.currentTime=3;replay.fire('click');assert.equal(video.currentTime,0);
video.fire('ended');assert.match(status.textContent,/手动勾选/);
video.fire('error');assert.match(status.textContent,/未能加载/);
console.log('PASS video player: no autoplay, resume, chapter seeking, transcript seeking, speed, back 10s, progress storage and error/end feedback.');
