import fs from 'node:fs'
const source=JSON.parse(fs.readFileSync('.evidence-results.json','utf8'))
const passed=Number(source.numPassedTests??0)
const failed=Number(source.numFailedTests??0)
const total=Number(source.numTotalTests??passed+failed)
const evidence={passed,total,status:failed===0&&total>0?'passing':'failing',ranAt:new Date().toISOString(),source:'src/tests/evidence.test.ts'}
fs.writeFileSync('public/evidence.json',JSON.stringify(evidence,null,2)+'\n')
console.log(`${passed}/${total} collaboration invariants ${evidence.status}`)
