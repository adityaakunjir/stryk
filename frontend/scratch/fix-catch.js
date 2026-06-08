const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/matches/[id]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace catch { with catch (err) { everywhere in this file
content = content.replace(/catch\s*\{/g, 'catch (err) {');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed matches/[id]/page.tsx');
