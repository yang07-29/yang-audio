/* Beginner teaching examples: structure, reachability and independently checked arithmetic. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const lessons = JSON.parse(fs.readFileSync(path.join(root,'assets/plain-language.json'),'utf8'));
assert.equal(lessons.length,23);
assert.equal(new Set(lessons.map(x=>x.id)).size,23);
for(const item of lessons){
  const html=fs.readFileSync(path.join(root,item.source),'utf8');
  assert.equal((html.match(/id="plain-start"/g)||[]).length,1,item.id);
  assert.equal((html.match(/<!-- plain-language:start -->/g)||[]).length,1);
  assert.ok(html.includes('href="#plain-start"'));
  assert.ok(html.includes(item.title));
  assert.equal(item.steps.length,3);
  assert.ok(item.terms.length>=3);
  for(const field of ['one','scene','bridge','trap','question','answer']) assert.ok(item[field].length>15,`${item.id} ${field}`);
  assert.match(html, /<details><summary>展开参考解释<\/summary>/);
  assert.match(html, /深入推导、注释代码、运行图和练习均保留/);
}
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
const rms=a=>Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);
near(32000/16000,2); near(32000/8000,4);
near(rms([1,-1,0,0]),Math.SQRT1_2); near(rms([1,-1,1,-1]),1);
near(20*Math.log10(2),6.020599913279624);
near(.25*4+.5*9+.25*1,5.75);
near(.8-.5,.3); near(.8-.4,.4);
near(320/16000,.02); near(160/16000,.01); near(1/16000*1000,.0625);
const w=.5,x=2,target=3,grad=2*(w*x-target)*x,newW=w-.1*grad;
near(grad,-8); near(newW,1.3); near((newW*x-target)**2,.16);
function ctc(tokens){let prev=null,out=[];for(const token of tokens){if(token!==prev&&token!=='_')out.push(token);prev=token;}return out.join('');}
assert.equal(ctc(['你','你','_','好','好']),'你好');
assert.equal(ctc(['哈','哈']),'哈');assert.equal(ctc(['哈','_','哈']),'哈哈');
assert.equal(ctc(['好','_','好','好']),'好好');
const se=(a,b)=>a.reduce((s,v,i)=>s+(v-b[i])**2,0);
near(se([0,2],[1,0])+se([1,0],[0,2]),10);
near(se([0,2],[0,2])+se([1,0],[1,0]),0);
near((2000-1300)/2000,.35);near((10-3)/10,.7);
near(50*4*Math.log2(1024),2000);near(16000*16,256000);
console.log('PASS plain language: 23 static beginner explanations, 69 worked steps, glossary/limitations/self-checks, arithmetic and CTC/PIT examples.');
