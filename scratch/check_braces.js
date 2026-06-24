const fs = require('fs');

const code = fs.readFileSync('client/src/features/media/pages/Detail.jsx', 'utf8');

// Scan through the code and trace curly braces and parenthesis
let curlies = 0;
let parens = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < code.length; i++) {
  const char = code[i];
  
  if (inString) {
    if (char === stringChar && code[i-1] !== '\\') {
      inString = false;
    }
    continue;
  }
  
  if (char === '"' || char === "'" || char === '`') {
    inString = true;
    stringChar = char;
    continue;
  }
  
  if (char === '{') {
    curlies++;
  } else if (char === '}') {
    curlies--;
    if (curlies < 0) {
      console.log(`Unmatched } at index ${i}, line ${code.slice(0, i).split('\n').length}`);
      curlies = 0;
    }
  } else if (char === '(') {
    parens++;
  } else if (char === ')') {
    parens--;
    if (parens < 0) {
      console.log(`Unmatched ) at index ${i}, line ${code.slice(0, i).split('\n').length}`);
      parens = 0;
    }
  }
}

console.log(`Final counts: curlies=${curlies}, parens=${parens}`);
