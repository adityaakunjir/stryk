const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, regex, replacement) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(regex, replacement);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const filesToFix = [
  'app/lobbies/page.tsx',
  'app/matches/page.tsx',
  'app/submit/page.tsx',
  'app/team-builder/page.tsx',
  'app/matches/[id]/page.tsx'
];

filesToFix.forEach(f => {
  const p = path.join(__dirname, '../', f);
  if (fs.existsSync(p)) {
    replaceInFile(p, /catch\s*\(\s*err\s*\)\s*\{/g, 'catch {');
    replaceInFile(p, /catch\s*\(\s*_\s*\)\s*\{/g, 'catch {');
    replaceInFile(p, /catch\s*\(\s*e\s*\)\s*\{/g, 'catch {');
  }
});

// Fix specific unused variables:
// In matches/page.tsx
const matchPagePath = path.join(__dirname, '../app/matches/page.tsx');
replaceInFile(matchPagePath, /useEffect\(\(\) => \{\n\s*fetchMatches\(\);\n\s*\}, \[\]\);/g, 'useEffect(() => {\n    fetchMatches();\n  }, [fetchMatches]);');

// In components/image-cropper.tsx
const cropperPath = path.join(__dirname, '../components/image-cropper.tsx');
replaceInFile(cropperPath, /useEffect\(\(\) => \{\n\s*clampPan\(\);\n\s*\}, \[scale\]\);/g, 'useEffect(() => {\n    clampPan();\n  }, [scale, clampPan]);');

// In components/player-card.tsx
const playerCardPath = path.join(__dirname, '../components/player-card.tsx');
replaceInFile(playerCardPath, /const \{\s*matches\s*=\s*\[\],\s*wins\s*=\s*0/g, 'const { wins = 0');
replaceInFile(playerCardPath, /const \{\s*matches,\s*wins\s*=\s*0/g, 'const { wins = 0');

// In components/player-context.tsx
const playerContextPath = path.join(__dirname, '../components/player-context.tsx');
replaceInFile(playerContextPath, /const toCamelCase = [\s\S]*?;\n\n/g, '');
replaceInFile(playerContextPath, /const toSnakeCase = [\s\S]*?;\n\n/g, '');

