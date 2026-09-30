const fs = require('fs');
const path = require('path');

const directoryPath = 'e:\\curlraven.com\\apps\\web\\src';

const replacements = [
  { search: /#172545/gi, replace: 'var(--color-navy)' },
  { search: /#F5F1E8/gi, replace: 'var(--color-cream)' },
  { search: /#C94227/gi, replace: 'var(--color-crimson)' },
  { search: /#EAE6DB/gi, replace: 'var(--color-mist)' },
  { search: /#6B7280/gi, replace: 'var(--color-gray)' },
  { search: /#D9D3C4/gi, replace: 'var(--color-border)' },
  { search: /#DAB205/gi, replace: 'var(--color-yellow)' },
  { search: /100vh/g, replace: '100dvh' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Do not replace in globals.css for the color definitions
      if (fullPath.includes('globals.css')) {
        for (const r of replacements) {
           if (r.search.toString().includes('100vh')) {
             if (content.match(r.search)) {
                content = content.replace(r.search, r.replace);
                modified = true;
             }
           }
        }
      } else {
        for (const r of replacements) {
          if (content.match(r.search)) {
            content = content.replace(r.search, r.replace);
            modified = true;
          }
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

processDirectory(directoryPath);
