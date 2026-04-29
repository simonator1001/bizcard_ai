const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = { ...process.env };

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.substring(0, eqIdx).trim();
      const val = line.substring(eqIdx + 1).trim();
      env[key] = val;
    }
  }
});

// Also load from hermes .env for backup
const hermesEnv = path.join(require('os').homedir(), '.hermes', '.env');
if (fs.existsSync(hermesEnv)) {
  const content = fs.readFileSync(hermesEnv, 'utf-8');
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const key = line.substring(0, eqIdx).trim();
        const val = line.substring(eqIdx + 1).trim();
        if (!env[key]) env[key] = val;
      }
    }
  });
}

console.log('Loaded env vars:');
for (const k of ['DEEPBRICK_API_KEY', 'DEEPBRICK_API_KEY_2', 'APPWRITE_API_KEY', 'APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID']) {
  const v = env[k];
  console.log(`  ${k}=${v ? v.substring(0, 15) + '...' : 'MISSING'}`);
}

// Start Next.js directly (not through npx/npm which may strip env vars)
const { spawn } = require('child_process');
const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
const server = spawn('node', [nextBin, 'start', '-p', '3457'], {
  cwd: __dirname,
  env,
  stdio: 'inherit',
});

server.on('exit', (code) => process.exit(code));
