'use strict';

const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

const root = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const all = { ...pkg.dependencies, ...pkg.devDependencies };

function installedVersion(name) {
  try {
    const file = join(root, 'node_modules', ...name.split('/'), 'package.json');
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).version : '(missing)';
  } catch (error) {
    return '(unknown: ' + error.message + ')';
  }
}

function registryLatest(name) {
  try {
    const raw = execFileSync('npm', [
      'view', name, 'version', '--json', '--fetch-retries=1', '--fetch-timeout=12000',
    ], { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.at(-1) : String(data);
  } catch (error) {
    return '(registry unavailable: ' + (error.status ?? error.message) + ')';
  }
}

console.log('IMPROMPTU — direct dependency baseline / latest public stable tag');
console.log('NAME | DECLARED | INSTALLED | REGISTRY LATEST');
for (const [name, range] of Object.entries(all).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(name + ' | ' + range + ' | ' + installedVersion(name) + ' | ' + registryLatest(name));
}
console.log('NODE = ' + process.version);
console.log('YARN PACKAGE MANAGER DECLARATION = ' + pkg.packageManager);
console.log('YARN CLI LATEST = ' + registryLatest('@yarnpkg/cli'));
console.log('INTENTIONALLY PINNED = ' + JSON.stringify({ resolutions: pkg.resolutions, nodeTypes: pkg.dependencies?.['@types/node'] }));
