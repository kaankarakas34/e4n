const fs = require('fs');
let content = fs.readFileSync('src/pages/DegerlendirmeBasvurusu.tsx', 'utf8');
content = content.replace(/\\\`/g, '`');
content = content.replace(/\\\$\{/g, '${');
fs.writeFileSync('src/pages/DegerlendirmeBasvurusu.tsx', content);
console.log('Fixed escaping!');
