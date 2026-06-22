const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findPhp() {
  try {
    execSync('php -v', { stdio: 'ignore' });
    return 'php';
  } catch (e) {}

  const commonPaths = [
    'C:\\xampp\\php\\php.exe',
    'D:\\xampp\\php\\php.exe',
    'C:\\Program Files\\PHP\\php.exe',
    'C:\\Program Files (x86)\\PHP\\php.exe',
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

const php = findPhp();
if (!php) {
  console.log('PHP executable not found. Skipping syntax check.');
  process.exit(0);
}

console.log(`Using PHP: ${php}`);

const files = [
  path.join(__dirname, '..', 'server-php', 'index.php'),
  path.join(__dirname, '..', 'server-php', 'controllers', 'AiController.php')
];

for (const file of files) {
  try {
    console.log(`Checking syntax of: ${file}`);
    const output = execSync(`"${php}" -l "${file}"`, { encoding: 'utf8' });
    console.log(output.trim());
  } catch (err) {
    console.error(`Syntax error in ${file}:`);
    console.error(err.stderr || err.message);
    process.exit(1);
  }
}

console.log('All checked PHP files are syntactically correct!');
