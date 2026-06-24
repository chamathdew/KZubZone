const fs = require('fs');

const code = fs.readFileSync('client/src/features/media/pages/Detail.jsx', 'utf8');

const lines = code.split('\n');
const stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for opening <div
  let pos = 0;
  while (true) {
    const nextDiv = line.indexOf('<div', pos);
    if (nextDiv === -1) break;
    
    // Check if it is self-closing on the same line: e.g. <div ... />
    const endOfTag = line.indexOf('>', nextDiv);
    let isSelfClosing = false;
    if (endOfTag !== -1) {
      if (line.slice(nextDiv, endOfTag).trim().endsWith('/')) {
        isSelfClosing = true;
      }
    }
    
    if (!isSelfClosing) {
      const charAfter = line[nextDiv + 4];
      if (charAfter === undefined || charAfter === ' ' || charAfter === '>' || charAfter === '\r' || charAfter === '\n') {
        stack.push({ line: i + 1, type: 'open' });
      }
    }
    pos = nextDiv + 4;
  }
  
  // Check for closing </div>
  pos = 0;
  while (true) {
    const nextCloseDiv = line.indexOf('</div>', pos);
    if (nextCloseDiv === -1) break;
    
    if (stack.length === 0) {
      console.log(`Unmatched </div> at line ${i + 1}`);
    } else {
      const last = stack.pop();
    }
    pos = nextCloseDiv + 6;
  }
}

if (stack.length > 0) {
  console.log("Unclosed divs remaining:");
  stack.forEach(d => console.log(`- Div opened at line ${d.line}`));
} else {
  console.log("All <div> tags are balanced!");
}
