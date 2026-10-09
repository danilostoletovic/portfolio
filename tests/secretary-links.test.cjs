const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function render(text, language) {
 const source=fs.readFileSync(path.join(__dirname,'../js/secretary.js'),'utf8');
 const fn=source.slice(source.indexOf('  function appendReplyText('),source.indexOf('  function addMessage('));
 const children=[];
 const context={URL,location:{href:'https://danilostoletovic.com/',origin:'https://danilostoletovic.com'},document:{createTextNode:text=>({text})},element:(tag,cls,text)=>({tag,text})};
 vm.createContext(context);
 if (language) {
  context.window=context;context.document.documentElement={lang:language};
  context.document.getElementById=()=>null;context.document.addEventListener=()=>{};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/i18n.js'),'utf8'),context);
 }
 vm.runInContext(fn,context);
 context.appendReplyText({append:(...nodes)=>children.push(...nodes)},text);
 return children;
}
test('Secretary renders Markdown, bare URLs and contact links without sentence punctuation',()=>{
 const nodes=render('[Timetable](/case-studies/class-timetable/) https://example.com/page. mailto:contact@danilostoletovic.com tel:+381677732060');
 const links=nodes.filter(n=>n.tag==='a');
 assert.equal(links.length,4);assert.equal(links[0].text,'Timetable');assert.equal(links[0].href,'https://danilostoletovic.com/case-studies/class-timetable/');
 assert.equal(links[1].href,'https://example.com/page');assert.equal(links[1].rel,'noopener noreferrer');assert.equal(links[1].target,'_blank');
 assert.equal(links[2].href,'mailto:contact@danilostoletovic.com');assert.equal(links[3].href,'tel:+381677732060');
 assert(nodes.some(n=>n.text==='.'));
});

test('Ana portfolio links retain the active locale while technical and external URLs stay unchanged',()=>{
 const links=render('[Project](/case-studies/secretary/) [API](/openapi.json) [GitHub](https://github.com/danilostoletovic)', 'sr-Latn').filter(n=>n.tag==='a');
 assert.equal(links[0].href,'/sr/case-studies/secretary/');
 assert.equal(links[1].href,'https://danilostoletovic.com/openapi.json');
 assert.equal(links[2].href,'https://github.com/danilostoletovic');
});
test('Secretary preserves unsafe schemes and HTML as inert text',()=>{
 const nodes=render('[bad](javascript:alert) [bad](data:text/html,test) <img src=x onerror=alert(1)> [credentials](https://user:password@example.com/)');
 assert.equal(nodes.filter(n=>n.tag==='a').length,0);
 assert(nodes.some(n=>n.text.includes('<img')));
});
