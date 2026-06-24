const fs = require('fs');

const code = fs.readFileSync('client/src/features/media/pages/Detail.jsx', 'utf8');

// Strip comments to avoid false positives
const cleanCode = code
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*/g, '');

const lines = cleanCode.split('\n');
const stack = [];

// Simple regex: match tag start "<" followed by letters/digits
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Find all matches for tags in this line
  let pos = 0;
  while (true) {
    const nextTag = line.indexOf('<', pos);
    if (nextTag === -1) break;
    
    pos = nextTag + 1;
    
    // Check if it's a closing tag: "</tag>"
    if (line[nextTag + 1] === '/') {
      const endName = line.indexOf('>', nextTag);
      if (endName === -1) continue;
      const tagName = line.slice(nextTag + 2, endName).trim().split(/\s+/)[0];
      
      // Ignore non-HTML tags or components like sub, related, item (used as JS variables in code like val < item)
      if (tagName && /^[a-zA-Z0-9.-]+$/.test(tagName)) {
        if (tagName === 'item' || tagName === 'comments' || tagName === 'related' || tagName === 'sub' || tagName === 'kw' || tagName === 'idx' || tagName === 'reply') {
          continue;
        }
        if (stack.length === 0) {
          console.log(`Unmatched closing tag </${tagName}> at line ${i + 1}`);
        } else {
          const last = stack.pop();
          if (last.tag !== tagName) {
            console.log(`Mismatched tags: opened <${last.tag}> at line ${last.line}, closed with </${tagName}> at line ${i + 1}`);
          }
        }
      }
      pos = endName + 1;
    } else {
      // Opening tag "<tag>"
      // Avoid matching "< " or standard comparison operators "val < 5"
      const charAfter = line[nextTag + 1];
      if (!charAfter || !/[a-zA-Z]/.test(charAfter)) {
        continue;
      }
      
      const endTag = line.indexOf('>', nextTag);
      if (endTag === -1) continue;
      
      // Check if it is self-closing: "<tag />"
      if (line[endTag - 1] === '/') {
        pos = endTag + 1;
        continue;
      }
      
      const tagContent = line.slice(nextTag + 1, endTag).trim();
      const tagName = tagContent.split(/\s+/)[0];
      
      if (tagName && /^[a-zA-Z0-9.-]+$/.test(tagName)) {
        if (tagName === 'item' || tagName === 'comments' || tagName === 'related' || tagName === 'sub' || tagName === 'kw' || tagName === 'idx' || tagName === 'reply') {
          continue;
        }
        stack.push({ tag: tagName, line: i + 1 });
      }
      pos = endTag + 1;
    }
  }
}

if (stack.length > 0) {
  console.log("Unclosed tags remaining on stack:");
  stack.forEach(item => {
    console.log(`- <${item.tag}> opened at line ${item.line}`);
  });
} else {
  console.log("All scanned HTML/JSX tags are balanced!");
}
