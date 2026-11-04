/**
 * fix-install.js — removes broken package directories then reinstalls
 * Run with: node fix-install.js
 */
const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const nodeModules = path.join(__dirname, 'frontend', 'node_modules')

// Packages that need their package.json verified
const toCheck = [
  'lucide-react', 'date-fns', 'axios', 'recharts',
  'react-hot-toast', 'react-dropzone', 'react-router-dom',
  'react', 'react-dom'
]

let needsReinstall = []

for (const pkg of toCheck) {
  const pkgJson = path.join(nodeModules, pkg, 'package.json')
  if (!fs.existsSync(pkgJson)) {
    console.log(`❌ Missing package.json: ${pkg}`)
    needsReinstall.push(pkg)
    // Remove the broken dir so npm reinstalls it properly
    const pkgDir = path.join(nodeModules, pkg)
    if (fs.existsSync(pkgDir)) {
      fs.rmSync(pkgDir, { recursive: true, force: true })
      console.log(`   Removed broken folder: ${pkgDir}`)
    }
  } else {
    const meta = JSON.parse(fs.readFileSync(pkgJson, 'utf8'))
    console.log(`✅ ${pkg}@${meta.version}`)
  }
}

if (needsReinstall.length > 0) {
  console.log('\nReinstalling missing packages...')
  try {
    execSync(
      `npm.cmd install ${needsReinstall.join(' ')} --legacy-peer-deps --ignore-scripts`,
      { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' }
    )
    console.log('✅ Reinstall complete')
  } catch(e) {
    console.error('Install failed:', e.message)
  }
} else {
  console.log('\n✅ All packages verified OK')
}
