#!/usr/bin/env node
'use strict';

/**
 * REORK OutcomeProof: reconcile sender-side email evidence against CRM send records.
 * Local and deterministic. It does NOT prove recipient delivery, reading or reply.
 * Read-only; no email send, credentials, API calls, storage, or third-party network.
 * Usage: node reconcile-send-records.js gmail.json crm.json
 *
 * Gmail items: [{to:["person@example.org"], email_ts:"2026-10-17T05:30:00-07:00"}]
 * CRM items:   [{email:"person@example.org", sent_at:"2026-10-17 12:30:00"}]
 * CRM naive sent_at is interpreted as UTC, never machine-local time.
 */
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

function key(email) {
  return String(email || '').trim().toLowerCase();
}
function isoTime(raw, naiveUtc=false) {
  if (!raw) return null;
  let s=String(raw).trim();
  if (naiveUtc && /^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d(?:\.\d+)?$/.test(s)) {
    s=s.replace(' ','T')+'Z';
  }
  const t=Date.parse(s);
  return Number.isFinite(t) ? t : null;
}
function normalizeGmail(rows) {
  assert.ok(Array.isArray(rows),'Gmail input must be a JSON array');
  const records=[],invalid=[];
  rows.forEach((row,index)=>{
    const list=Array.isArray(row.to)?row.to:[row.to];
    const ts=isoTime(row.email_ts||row.sent_at||row.timestamp);
    if(ts===null||!list.length) {invalid.push(index);return;}
    list.forEach(raw=>{
      const email=key(raw);
      if (!email || !email.includes('@')) {invalid.push(index);return;}
      records.push({email,ts});
    });
  });
  return {records,invalid};
}
function normalizeCrm(rows) {
  assert.ok(Array.isArray(rows),'CRM input must be a JSON array');
  const records=[],invalid=[];
  rows.forEach((row,index)=>{
    const email=key(row.email),ts=isoTime(row.sent_at,true);
    if (!email.includes('@')||ts===null) {invalid.push(index);return;}
    records.push({email,ts});
  });
  return {records,invalid};
}
const fingerprint=v=>crypto.createHash('sha256').update(v).digest('hex').slice(0,10);
function reconcile(gmailRows,crmRows,{toleranceSeconds=60}={}) {
  assert.ok(Number.isInteger(toleranceSeconds)&&toleranceSeconds>=0&&toleranceSeconds<=3600,'safe tolerance range 0..3600 seconds');
  const sender=normalizeGmail(gmailRows),crm=normalizeCrm(crmRows);
  const candidates=sender.records.map((s,i)=>{
    const list=crm.records.map((c,j)=>({i,j,diff:Math.abs(s.ts-c.ts)}))
      .filter(v=>crm.records[v.j].email===s.email && v.diff<=toleranceSeconds*1000)
      .sort((a,b)=>a.diff-b.diff||a.j-b.j);
    return {i,list};
  });
  // Sort sender matches by fewest eligible candidates first; no opportunistic double-use.
  candidates.sort((a,b)=>a.list.length-b.list.length||a.i-b.i);
  const used=new Set(),pairs=[];
  for(const c of candidates) {
    const target=c.list.find(x=>!used.has(x.j));
    if(target) {used.add(target.j);pairs.push(target);}
  }
  const sentUsed=new Set(pairs.map(p=>p.i));
  const matched=pairs.map(p=>({recipient_hash:fingerprint(sender.records[p.i].email),time_delta_seconds:p.diff/1000}));
  const gmailUnmatched=sender.records.filter((_,i)=>!sentUsed.has(i)).map(s=>({recipient_hash:fingerprint(s.email),time_utc:new Date(s.ts).toISOString()}));
  const crmUnmatched=crm.records.filter((_,j)=>!used.has(j)).map(c=>({recipient_hash:fingerprint(c.email),time_utc:new Date(c.ts).toISOString()}));
  return {
    conclusion:'sender_record_reconciliation_only',
    does_not_prove:['recipient_delivery','read','reply','payment','buyer_interest'],
    tolerance_seconds:toleranceSeconds,
    gmail_sent_records:sender.records.length,
    crm_sent_records:crm.records.length,
    matched_count:matched.length,
    unmatched_gmail_count:gmailUnmatched.length,
    unmatched_crm_count:crmUnmatched.length,
    invalid_gmail_rows:sender.invalid,
    invalid_crm_rows:crm.invalid,
    matched,unmatched_gmail:gmailUnmatched,unmatched_crm:crmUnmatched
  };
}
if(require.main===module) {
  try {
    if(process.argv.length!==4) throw Error('Usage: node reconcile-send-records.js gmail.json crm.json');
    const gmail=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
    const crm=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
    process.stdout.write(JSON.stringify(reconcile(gmail,crm),null,2)+'\n');
  } catch(err) {
    process.stderr.write('RECONCILE_ERROR: '+err.message+'\n');
    process.exitCode=1;
  }
}
module.exports={reconcile,normalizeGmail,normalizeCrm,isoTime};
