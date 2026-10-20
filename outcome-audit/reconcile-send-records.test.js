const test=require('node:test');
const assert=require('node:assert/strict');
const {reconcile,isoTime}=require('./reconcile-send-records');
const gmail=[
  {to:['x1@example.org'],email_ts:'2026-10-16T14:47:54-07:00'},
  {to:['x2@example.org'],email_ts:'2026-10-16T14:46:27-07:00'},
  {to:['x3@example.org'],email_ts:'2026-10-17T05:29:32-07:00'}
];
const crm=[
  {email:'X1@example.org',sent_at:'2026-10-16 21:47:54'},
  {email:'x2@example.org',sent_at:'2026-10-16 21:46:27'},
  {email:'x3@example.org',sent_at:'2026-10-17 12:29:32'}
];
test('reconciles three real-world format entries across Gmail offsets and CRM naive UTC',()=>{
 const v=reconcile(gmail,crm);
 assert.equal(v.matched_count,3);
 assert.equal(v.unmatched_gmail_count,0);
 assert.equal(v.unmatched_crm_count,0);
 assert.equal(v.conclusion,'sender_record_reconciliation_only');
 assert.ok(v.does_not_prove.includes('recipient_delivery'));
 assert.ok(JSON.stringify(v).indexOf('x1@example.org')<0);
});
test('unmatched email remains unmatched and is not a delivered email claim',()=>{
 const v=reconcile([...gmail,{to:['z@example.org'],email_ts:'2026-10-17T10:00:00Z'}],crm);
 assert.equal(v.matched_count,3);
 assert.equal(v.unmatched_gmail_count,1);
});
test('same destination row cannot prove two source sends',()=>{
 const s=[{to:['a@example.org'],email_ts:'2026-10-19T00:00:00Z'},{to:['a@example.org'],email_ts:'2026-10-19T00:00:10Z'}];
 const d=[{email:'a@example.org',sent_at:'2026-10-19 00:00:00'}];
 const v=reconcile(s,d);assert.equal(v.matched_count,1);assert.equal(v.unmatched_gmail_count,1);
});
test('invalid rows do not produce matches',()=>{
 const v=reconcile([{to:['a@example.org'],email_ts:''}],crm);
 assert.equal(v.matched_count,0);assert.deepEqual(v.invalid_gmail_rows,[0]);
});
test('different recipient fails even with matching timestamp',()=>{
 const v=reconcile([{to:['other@example.org'],email_ts:'2026-10-16T14:47:54-07:00'}],[crm[0]]);
 assert.equal(v.matched_count,0);
});
test('time tolerance does not silently accept a two hour difference',()=>{
 const v=reconcile([gmail[0]],[{email:'x1@example.org',sent_at:'2026-10-16 23:47:54'}]);
 assert.equal(v.matched_count,0);
});
test('timezone assumptions are explicit and reproducible',()=>{
 assert.equal(isoTime('2026-10-16 21:47:54',true),isoTime('2026-10-16T14:47:54-07:00'));
});
test('out-of-range tolerance rejected',()=>{
 assert.throws(()=>reconcile([],[],{toleranceSeconds:90000}),/safe tolerance/);
});
