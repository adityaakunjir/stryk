const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function replaceInFile(filePath, regex, replacement) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(regex, replacement);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const dirs = [path.join(__dirname, '../app'), path.join(__dirname, '../components')];
dirs.forEach(dir => {
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      // Fix catch (e) and catch (err) to catch
      replaceInFile(filePath, /catch\s*\(\s*e\s*\)\s*\{/g, 'catch {');
      replaceInFile(filePath, /catch\s*\(\s*err\s*\)\s*\{/g, 'catch {');
      replaceInFile(filePath, /catch\s*\(\s*_\s*\)\s*\{/g, 'catch {');
      
      // Also remove unused `const _ = ...` or `import { Plus } ...` etc.
      replaceInFile(filePath, /import \{[^}]*Plus[^}]*\} from "lucide-react";/g, (match) => {
        return match.replace(/\bPlus\b\s*,?\s*/g, '');
      });
      replaceInFile(filePath, /,\s*\}/g, '}'); // clean up trailing commas from import delete
    }
  });
});
