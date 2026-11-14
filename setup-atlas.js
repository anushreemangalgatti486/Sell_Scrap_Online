/**
 * setup-atlas.js
 * Run: node setup-atlas.js
 * Paste your MongoDB Atlas URI when prompted and it updates backend/.env automatically.
 */
const readline = require('readline')
const fs       = require('fs')
const path     = require('path')

const envPath = path.join(__dirname, 'backend', '.env')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

console.log('\n  ScrapBazaar — MongoDB Atlas Setup')
console.log('  ==================================')
console.log('\n  Get your free Atlas URI at: https://www.mongodb.com/atlas/database')
console.log('  (Sign up → Create M0 free cluster → Connect → Drivers → Copy URI)\n')

rl.question('  Paste your MongoDB Atlas URI here:\n  > ', (uri) => {
  uri = uri.trim()
  if (!uri.startsWith('mongodb')) {
    console.log('\n  ❌ That does not look like a valid MongoDB URI. Try again.')
    rl.close()
    return
  }

  let env = fs.readFileSync(envPath, 'utf8')
  env = env.replace(/^MONGODB_URI=.*/m, `MONGODB_URI=${uri}`)
  fs.writeFileSync(envPath, env)

  console.log('\n  ✅ backend/.env updated!')
  console.log('  Now run:  node start-backend.bat')
  console.log('  Or:       cd backend && node server.js\n')
  rl.close()
})
