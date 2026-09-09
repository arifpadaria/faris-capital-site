'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Prepare all content before calling this. Individual replacements are atomic;
// an on-disk manifest supports recovery after a process/machine interruption.
function writeLockedOutputs(root, output, io) {
  const base = path.resolve(root);
  const names = Object.keys(output);
  for (const name of names) if (io.existsSync(path.join(base, name) + '.publisher-tmp')) throw new Error('Unresolved publisher staging file; recover before retrying');
  for (const name of names) {
    if (path.isAbsolute(name) || name.split(/[\\/]/).some(p => p === '..' || p === '.')) throw new Error('Unsafe output path');
    let current = base;
    for (const part of name.split('/')) {
      current = path.join(current, part);
      if (io.existsSync(current) && io.lstatSync(current).isSymbolicLink()) throw new Error('Symlink output is not allowed');
    }
  }
  const backup = path.join(base, '.publisher-backups', `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
  io.mkdirSync(backup, { recursive: true });
  const before = {};
  for (const name of names) {
    const target = path.join(base, name);
    before[name] = io.existsSync(target);
    if (before[name]) {
      const dest = path.join(backup, name);
      io.mkdirSync(path.dirname(dest), { recursive: true });
      io.copyFileSync(target, dest);
    }
  }
  io.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify({ root: base, before }, null, 2));
  try {
    for (const name of names) {
      const dest = path.join(base, name);
      io.mkdirSync(path.dirname(dest), { recursive: true });
      const staged = dest + '.publisher-tmp';
      if (io.existsSync(staged)) throw new Error(`Unresolved staging file: ${staged}`);
      io.writeFileSync(staged, output[name], { flag: 'wx' });
      io.renameSync(staged, dest);
    }
  } catch (err) {
    for (const name of names) {
      const dest = path.join(base, name);
      if (before[name]) io.copyFileSync(path.join(backup, name), dest);
      else if (io.existsSync(dest)) io.unlinkSync(dest);
      if (io.existsSync(dest + '.publisher-tmp')) io.unlinkSync(dest + '.publisher-tmp');
    }
    throw err;
  }
  return backup;
}
function writeOutputs(root, output, io = fs, expected = {}) {
  const lock = path.join(root, '.publisher.lock');
  const fd = io.openSync(lock, 'wx');
  try {
    for (const [name, content] of Object.entries(expected)) {
      if (io.readFileSync(path.join(root, name), 'utf8') !== content) throw new Error('Source changed during publication; reload and retry');
    }
    return writeLockedOutputs(root, output, io);
  }
  finally { io.closeSync(fd); io.unlinkSync(lock); }
}
module.exports = { writeOutputs };
