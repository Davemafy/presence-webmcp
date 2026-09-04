import fs from "node:fs";
const app=fs.readFileSync("src/App.tsx","utf8"),css=fs.readFileSync("src/styles.css","utf8"),store=fs.readFileSync("src/domain/store.ts","utf8");
const checks=[
["complete Aurora nav",/Customers.*Pricing.*Resources/s.test(app)],
["specific Aurora hero",app.includes("Bring every product decision into the same orbit")],
["real product roadmap UI",app.includes("Launch readiness")&&app.includes("decision-strip")],
["customer proof",app.includes("12,400+ product decisions")],
["three product features",app.includes("Decisions with history")&&app.includes("Human + agent workflows")&&app.includes("Launch coordination")],
["workflow",app.includes("Brief','Review','Decision','Build','Launch")],
["testimonial",app.includes("VP Product · Northstar")],
["integrations",app.includes("GitHub','Slack','Linear','Figma','Notion','Jira")],
["conversion and footer",app.includes("Make the next launch feel quieter")&&app.includes("All systems normal")],
["Tablet real page before admission",app.includes("vacant-tablet-underlay")&&app.includes("<TabletSite active={false}/>")],
["Mobile real page sections",app.includes("aurora-mobile-sections")&&app.includes("<AuroraSections/>")],
["responsive product styles",css.includes("@container (max-width: 520px)")],
["no old placeholder card triplet",!app.includes('<div className={`cards editable-target')],
["semantic agent proposal preserved",store.includes("agentPropose")&&store.includes("expectedRevision")],
["human semantic reorder preserved",app.includes("humanReorderHero")],
];
let passed=0;for(const [name,ok] of checks){console.log(`${ok?"PASS":"FAIL"}  ${name}`);if(ok)passed++;}
console.log(`${passed}/${checks.length} Aurora product acceptance source checks ${passed===checks.length?"PASS":"FAIL"}`);if(passed!==checks.length)process.exit(1);
