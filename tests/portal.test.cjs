const assert = require('node:assert/strict');
const { resourceURL } = require('../assets/portal.js');
const root = 'https://yang07-29.github.io/yang-audio/';
assert.equal(resourceURL('tutorial/chapters/08_aec.html', root).path, 'tutorial/chapters/08_aec.html');
assert.equal(resourceURL('tutorial/chapters/08_aec.html?embedded=1#panel-A', root).href, root+'tutorial/chapters/08_aec.html#panel-A');
for (const bad of ['javascript:alert(1)', 'https://evil.example/x.html', '//evil.example/a.html', '/other/x.html', '../x.html', '%2e%2e/x.html', 'index.html', 'assets/study-ui.js', 'data:text/html,x', '%xx.html']) assert.equal(resourceURL(bad, root), null, bad);
for (const bad of ['tutorial/%2e%2e%2f..%2foutside.html', 'tutorial/%2e%2e%5coutside.html', 'tutorial/%252e%252e%252foutside.html']) assert.equal(resourceURL(bad, root), null, bad);
assert.equal(resourceURL('tutorial/study/plan.html?day=d01', root).route, 'tutorial/study/plan.html?day=d01');
console.log('PASS portal: GitHub subpath, fragment, query, embedded cleanup, external/traversal/malformed URL rejection');
