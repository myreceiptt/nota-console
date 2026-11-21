'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const semver = require('semver');

const file = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

function versionsWithinCurrentMajor(name, major) {
  const raw = execFileSync('npm', ['view', name + '@' + major, 'version', '--json', '--fetch-retries=1', '--fetch-timeout=20000'], {
    encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const data = JSON.parse(raw);
  const candidates = Array.isArray(data) ? data : [data];
  return semver.maxSatisfying(candidates.filter(x => semver.valid(x) && !semver.prerelease(x)), '^' + major + '.0.0');
}

let changed = 0;
for (const key of ['dependencies', 'devDependencies']) {
  for (const [name, range] of Object.entries(pkg[key] || {})) {
    // Intentional pins such as @types/node or semver resolutions remain untouched.
    if (!/^\^\d+\.\d+\.\d+$/.test(range)) {
      console.log('PIN OR NON-CARET: ' + name + ' ' + range);
      continue;
    }
    const current = range.slice(1);
    const major = Number(current.split('.')[0]);
    const target = versionsWithinCurrentMajor(name, major);
    if (!target) throw new Error('No compatible stable release for ' + name + ' ' + range);
    if (semver.gt(target, current)) {
      pkg[key][name] = '^' + target;
      console.log('SAFE MONTHLY: ' + name + ' ' + range + ' -> ^' + target);
      changed++;
    } else {
      console.log('CURRENT: ' + name + ' ' + range);
    }
  }
}

fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated ' + changed + ' direct dependency ranges without changing any major version.');
