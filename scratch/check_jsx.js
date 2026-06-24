const fs = require('fs');

const code = fs.readFileSync('client/src/features/media/pages/Detail.jsx', 'utf8');

// We want to find tags like <details or <div or </div across lines
let pos = 0;
const stack = [];

function getLineNumber(index) {
  return code.slice(0, index).split('\n').length;
}

while (pos < code.length) {
  const nextOpen = code.indexOf('<', pos);
  if (nextOpen === -1) break;

  pos = nextOpen + 1;

  // Check if it's a comment: <!-- --> or {/* */}, or comparison < or <=
  const charAfter = code[nextOpen + 1];
  if (!charAfter || !/[a-zA-Z/]/.test(charAfter)) {
    continue; // not a tag
  }

  // Check if it's a closing tag </tagName>
  if (charAfter === '/') {
    const nextClose = code.indexOf('>', nextOpen);
    if (nextClose === -1) continue;
    const tagName = code.slice(nextOpen + 2, nextClose).trim().split(/\s+/)[0];
    
    if (tagName && /^[a-zA-Z0-9.-]+$/.test(tagName)) {
      if (['item', 'comments', 'related', 'sub', 'kw', 'idx', 'reply', 'a', 'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'section', 'details', 'summary', 'svg', 'path', 'table', 'tbody', 'tr', 'td', 'form', 'textarea', 'button', 'iframe', 'img', 'meta'].includes(tagName.toLowerCase())) {
        if (stack.length === 0) {
          console.log(`Unmatched closing tag </${tagName}> at line ${getLineNumber(nextOpen)}`);
        } else {
          const last = stack.pop();
          if (last.tag.toLowerCase() !== tagName.toLowerCase()) {
            console.log(`Mismatched tags: opened <${last.tag}> at line ${last.line}, closed with </${tagName}> at line ${getLineNumber(nextOpen)}`);
          }
        }
      }
    }
    pos = nextClose + 1;
  } else {
    // Opening tag <tagName ... >
    const nextClose = code.indexOf('>', nextOpen);
    if (nextClose === -1) continue;

    // Check if it is self-closing <tagName />
    const isSelfClosing = code.slice(nextOpen, nextClose).trim().endsWith('/');
    
    // Extract tag content between < and >
    const tagContent = code.slice(nextOpen + 1, nextClose).trim();
    const tagName = tagContent.split(/[\s>]+/)[0];

    if (tagName && /^[a-zA-Z0-9.-]+$/.test(tagName)) {
      if (['item', 'comments', 'related', 'sub', 'kw', 'idx', 'reply', 'a', 'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'section', 'details', 'summary', 'svg', 'path', 'table', 'tbody', 'tr', 'td', 'form', 'textarea', 'button', 'iframe', 'img', 'meta'].includes(tagName.toLowerCase())) {
        if (isSelfClosing) {
          // Self-closing, do not push to stack
        } else {
          stack.push({ tag: tagName, line: getLineNumber(nextOpen) });
        }
      }
    }
    pos = nextClose + 1;
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
