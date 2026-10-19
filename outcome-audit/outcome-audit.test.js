const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function page() {
 const html=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
 const match=html.match(/<script>([\s\S]*?)<\/script>/i);
 assert.ok(match,'inline demo logic must exist');
 const fields=Object.fromEntries(['goal','min','got','receipt','verdict','run'].map(id=>[id,{value:'',innerHTML:'',addEventListener(name,fn){this[name]=fn}}]));
 Object.assign(fields.goal,{value:'CRM leads created'});
 Object.assign(fields.min,{value:'1'});
 const doc={getElementById(id){return fields[id]}};
 const context={document:doc,window:{}};
 vm.createContext(context);
 vm.runInContext(match[1],context,{timeout:800});
 return {fields,check:()=>context.window.REORK_OUTCOME_DEMO.verify()};
}

test('no observed result is not treated as success',()=>{
 const {check}=page();assert.equal(check(),'OUTCOME NOT VERIFIED');
});
test('observed zero against target is a mismatch',()=>{
 const {fields,check}=page();fields.got.value='0';assert.equal(check(),'REPORTED MISMATCH');
});
test('matching count without receipt is unverified',()=>{
 const {fields,check}=page();fields.got.value='1';assert.equal(check(),'UNVERIFIED WITHOUT RECEIPT');
});
test('matching count with receipt is not called independently verified',()=>{
 const {fields,check}=page();fields.got.value='1';fields.receipt.value='CRM-123';assert.equal(check(),'EVIDENCE REFERENCE PROVIDED');assert.match(fields.verdict.innerHTML,/cannot independently authenticate/);
});
test('reject invalid target or negative observed counts',()=>{
 const {fields,check}=page();fields.min.value='oops';assert.equal(check(),'INVALID INPUT');fields.min.value='1';fields.got.value='-2';assert.equal(check(),'INVALID INPUT');
});
test('untrusted labels are escaped and do not execute injected markup',()=>{
 const {fields,check}=page();fields.got.value='100';fields.receipt.value='<img src=x>';assert.equal(check(),'EVIDENCE REFERENCE PROVIDED');assert.ok(!fields.verdict.innerHTML.includes('<img'));
});
