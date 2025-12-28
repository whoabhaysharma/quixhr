
const fs = require('fs');
const path = require('path');

const dir = 'node_modules/@prisma/client';
try {
    const files = fs.readdirSync(dir);
    const stats = fs.statSync(path.join(dir, 'index.d.ts'));
    console.log('Files:', files);
    console.log('index.d.ts mtime:', stats.mtime);

    // Check for leaveBalances content
    const content = fs.readFileSync(path.join(dir, 'index.d.ts'), 'utf8');
    const hasBalances = content.includes('leaveBalances');
    console.log('Has leaveBalances:', hasBalances);
} catch (e) {
    console.error(e);
}
