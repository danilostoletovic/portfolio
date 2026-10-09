const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/secretary.js'),'utf8');
const context={TextDecoder};vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('  async function readStreamingReply('),source.indexOf('  function addMessage(')),context);
const encode=new TextEncoder();
function response(events){const bytes=encode.encode(events.map(value=>'data: '+JSON.stringify(value)+'\r\n\r\n').join(''));return new Response(new ReadableStream({start(c){for(const byte of bytes)c.enqueue(new Uint8Array([byte]));c.close();}}));}
test('frontend reads fragmented multilingual deltas and commits final text',async()=>{
 const updates=[];assert.equal(await context.readStreamingReply(response([{type:'delta',text:'Ćao '},{type:'delta',text:'Ana'},{type:'done',reply:'Ćao Ana'}]),text=>updates.push(text)),'Ćao Ana');assert.deepEqual(updates,['Ćao ','Ćao Ana']);
});
test('frontend rejects incomplete, invalid, error, and mismatched streams',async()=>{
 for(const events of [[{type:'delta',text:'partial'}],[{type:'delta',text:12}],[{error:{message:'private'}}],[{type:'delta',text:'hello'},{type:'done',reply:'different'}],[{type:'delta',text:'x'.repeat(6001)}]])await assert.rejects(context.readStreamingReply(response(events),()=>{}));
});
