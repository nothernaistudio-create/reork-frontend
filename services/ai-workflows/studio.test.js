'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
const code=(html.match(/<script>([\s\S]+?)<\/script>/)||[])[1];assert.ok(code,'inline script exists');
function load(){
const ids=['intake','volume','minutes','outcome','tools','deadline','sensitive','savings','warn','output','result','copy','send'];
const e=Object.fromEntries(ids.map(id=>[id,{value:'',textContent:'',hidden:true,href:'',handlers:{},addEventListener(n,fn){this.handlers[n]=fn},scrollIntoView(){}}]));
e.volume.value='40';e.minutes.value='15';
const problems=[{value:'lead_response',checked:true},{value:'quote_handoff',checked:false},{value:'invoice_followup',checked:false},{value:'data_reconciliation',checked:false},{value:'report_delivery',checked:false}];
problems.forEach(p=>p.addEventListener=(n,fn)=>p.handler=fn);
const document={getElementById:id=>e[id],querySelectorAll:q=>q.includes(':checked')?problems.filter(p=>p.checked):problems};
const window={},context={document,window,navigator:{clipboard:{writeText:async()=>{}}}};
vm.createContext(context);vm.runInContext(code,context,{timeout:700});
return {e,s:window.REORK_STUDIO};
}
test('branding and default workload',()=>{const {e}=load();assert.ok(html.includes('REORK <span>AI'));assert.equal(e.savings.textContent,'10 h/month')});
test('never confuses baseline time with proven savings',()=>{const {s}=load();assert.equal(s.workload(50,30),25);const b=s.recommend({ids:['data_reconciliation'],tools:'Sheets',outcome:'Reconcile invoices',volume:50,minutes:30,deadline:'this_month',sensitive:'no'});assert.match(b,/25 hours per month/);assert.match(b,/not an estimate of savings/);assert.match(b,/not a confirmed client order/)});
test('regulated inputs gate to review',()=>{const {s}=load();const b=s.recommend({ids:['lead_response'],tools:'',outcome:'Respond to leads',volume:10,minutes:10,deadline:'this_week',sensitive:'yes'});assert.match(b,/Human review of data security/)});
test('empty outcome cannot create an email',()=>{const {e}=load();e.intake.handlers.submit({preventDefault(){}});assert.equal(e.output.hidden,true);assert.equal(e.send.href,'')});
test('qualified scope generates client-controlled email link',()=>{const {e}=load();e.outcome.value='Every lead gets an answer within 24 hours';e.tools.value='Gmail and Sheets';e.sensitive.value='no';e.deadline.value='this_month';e.intake.handlers.submit({preventDefault(){}});assert.equal(e.output.hidden,false);assert.match(e.send.href,/^mailto:info@reorkai.com/);assert.match(e.result.textContent,/lead intake/)});
