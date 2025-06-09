const fs = require('fs');

const packagePath = 'PokeDataFunc/package.json';
const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const scripts = packageContent.scripts || {};
let npmUsage = 0;
let pnpmUsage = 0;

console.log('🔍 Analyzing package.json scripts for package manager usage:');
console.log('=' .repeat(60));

Object.entries(scripts).forEach(([name, script]) => {
    const hasNpm = script.includes('npm ');
    const hasPnpm = script.includes('pnpm ');
    
    if (hasNpm) {
        npmUsage++;
        console.log(`❌ ${name}: "${script}" (contains "npm ")`);
    } else if (hasPnpm) {
        pnpmUsage++;
        console.log(`✅ ${name}: "${script}" (contains "pnpm ")`);
    } else {
        console.log(`⚪ ${name}: "${script}" (no package manager detected)`);
    }
});

console.log('\n📊 Summary:');
console.log(`npm usage: ${npmUsage}`);
console.log(`pnpm usage: ${pnpmUsage}`);

if (npmUsage === 0 && pnpmUsage > 0) {
    console.log('✅ Result: All scripts use pnpm (consistent)');
} else if (npmUsage > 0 && pnpmUsage === 0) {
    console.log('⚠️ Result: Scripts use npm - consider pnpm for consistency');
} else if (npmUsage > 0 && pnpmUsage > 0) {
    console.log('❌ Result: Mixed npm/pnpm usage in scripts - should be consistent');
} else {
    console.log('✅ Result: No explicit package manager usage in scripts');
}
