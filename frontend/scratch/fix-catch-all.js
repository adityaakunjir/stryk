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
      replaceInFile(filePath, /catch\s*\{\s*(console\.error\([^,;]+,\s*err\);)/g, 'catch (err) { $1');
      replaceInFile(filePath, /catch\s*\{\s*(console\.error\([^,;]+,\s*e\);)/g, 'catch (e) { $1');
      replaceInFile(filePath, /catch\s*\{\s*(console\.error\(err\);)/g, 'catch (err) { $1');
      replaceInFile(filePath, /catch\s*\{\s*(console\.error\(e\);)/g, 'catch (e) { $1');
    }
  });
});
