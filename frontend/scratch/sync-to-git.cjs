const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = 'C:/Users/KarthikM/Downloads/Quadra-asset-application--main/Quadra-asset-application--main';
const targetDir = 'C:/Users/KarthikM/Documents/asset app';

console.log('Comparing and syncing files to git repository at:', targetDir);

const filesToSync = [
  'vercel.json',
  'frontend/public/AssetMouse.svg',
  'frontend/src/Asset/Components/AssetMouseIcon.tsx',
  'frontend/src/Asset/Components/AssetIcon.tsx',
  'frontend/src/Asset/Utils/categoryIcon.tsx',
  'frontend/src/Asset/Pages/NewAssetRequest.tsx',
  'frontend/src/Asset/Pages/AdminDashboard.tsx',
  'frontend/src/Asset/Pages/EmployeeMyAssets.tsx',
  'frontend/src/Asset/Pages/AssetManagerDashboard.tsx',
  'frontend/src/Asset/Pages/ManagerApproval.tsx',
  'frontend/src/Asset/Pages/MyAssetRequests.tsx',
  'frontend/src/Asset/Pages/AssetInventory.tsx',
  'frontend/src/Asset/Pages/EmployeesAssetList.tsx',
  'frontend/src/Asset/Pages/AssetReports.tsx',
  'frontend/src/Asset/Services/AssetReportsService.ts',
  'frontend/vite.config.ts',
];

for (const rel of filesToSync) {
  const src = path.join(sourceDir, rel);
  const dst = path.join(targetDir, rel);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log(`Synced: ${rel}`);
  } else {
    console.warn(`Source not found: ${src}`);
  }
}

console.log('\nChecking git status in target repo:');
const status = execSync(`git -C "${targetDir}" status -s`, { encoding: 'utf8' });
console.log(status || 'No changes');
