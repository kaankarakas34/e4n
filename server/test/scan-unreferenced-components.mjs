import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = walk('src');
const contents = allFiles.map(f => ({
  file: f,
  rel: path.relative('.', f).replace(/\\/g, '/'),
  content: fs.readFileSync(f, 'utf8')
}));

const unreferenced = [];

for (const f of allFiles) {
  const baseName = path.basename(f).replace(/\.(ts|tsx)$/, '');
  if (['main', 'App', 'index', 'vite-env.d'].includes(baseName)) continue;

  let importedCount = 0;
  for (const c of contents) {
    if (c.file === f) continue;
    // Look for occurrences of baseName in import statements
    if (c.content.includes(`/${baseName}'`) ||
        c.content.includes(`/${baseName}"`) ||
        c.content.includes(`'./${baseName}'`) ||
        c.content.includes(`"${baseName}"`)) {
      importedCount++;
    }
  }

  if (importedCount === 0) {
    unreferenced.push({
      file: path.relative('.', f).replace(/\\/g, '/'),
      baseName
    });
  }
}

console.log(`Unreferenced source files count: ${unreferenced.length}`);
for (const u of unreferenced) {
  console.log(`  - ${u.file}`);
}
