const { execSync } = require('child_process');
const fs = require('fs');

console.log('--- Checking Documents/asset app ---');
try {
  const remotes = execSync('git -C "C:/Users/KarthikM/Documents/asset app" remote -v', { encoding: 'utf8' });
  console.log('Git remotes:', remotes);
  const status = execSync('git -C "C:/Users/KarthikM/Documents/asset app" status', { encoding: 'utf8' });
  console.log('Git status:', status);
} catch (e) {
  console.log('Error checking git in Documents/asset app:', e.message);
}

console.log('\n--- Checking Downloads repo ---');
try {
  const remotes = execSync('git remote -v', { encoding: 'utf8' });
  console.log('Downloads remotes:', remotes);
} catch (e) {
  console.log('Downloads error:', e.message);
}

console.log('\n--- Checking vercel credentials ---');
try {
  const home = process.env.USERPROFILE || process.env.HOME;
  const vercelConfig = `${home}/.vercel`;
  if (fs.existsSync(vercelConfig)) {
    console.log('.vercel exists in home:', fs.readdirSync(vercelConfig));
  } else {
    console.log('No .vercel in home');
  }
} catch (e) {
  console.log('Error checking .vercel:', e.message);
}
