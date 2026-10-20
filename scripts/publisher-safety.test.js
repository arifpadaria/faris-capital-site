'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { formatContent, serializeEntry, validateDatabase } = require('./publisher-safety');
const { buildSite } = require('./generate-thesis-pages');
const { writeOutputs } = require('./site-writer');
const database = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/perspectives.json')));
const hostile = '"quoted" `backtick` ${globalThis.auditMarker = 7} $(printf MARKER)\n</script><img src=x onerror=alert(1)>&';
const fixture = () => structuredClone(database);

test('serialized input stays literal', () => {
  const context = {};
  vm.runInNewContext('result = [' + serializeEntry({ content: hostile }) + '][0]', context);
  assert.equal(context.auditMarker, undefined);
  assert.equal(context.result.content, hostile);
});
test('body text preserves real paragraph breaks and escapes HTML', () => {
  assert.equal(formatContent('a & b\n<c>\n\n"quoted"'), '<p>a &amp; b<br>&lt;c&gt;</p>\n      <p>&quot;quoted&quot;</p>');
});
test('all existing articles validate unchanged', () => {
  assert.ok(validateDatabase(database).posts.length > 0);
});
for (const [name, mutate] of [
  ['traversal', d => d.posts[0].id = '../escape'],
  ['duplicate', d => d.posts.push(d.posts[0])],
  ['HTML event handler', d => d.posts[0].content = '<p onclick="alert(1)">x</p>'],
  ['script', d => d.posts[0].content = '<script>alert(1)</script>'],
  ['javascript URL', d => d.posts[0].linkedinUrl = 'javascript:alert(1)'],
  ['lookalike host', d => d.posts[0].linkedinUrl = 'https://linkedin.com.evil.test/x'],
  ['URL credentials', d => d.posts[0].linkedinUrl = 'https://name@www.linkedin.com/x'],
  ['missing title', d => d.posts[0].title = ''],
  ['invalid date', d => d.posts[0].date = 'invalid']
]) test(`rejects ${name} before generation`, () => { const d = fixture(); mutate(d); assert.throws(() => buildSite(d, '?v=40')); });

test('real generator escapes metadata and preserves body; browser bundle has no article bodies', () => {
  const d = fixture(); d.posts[0].title = hostile; d.posts[0].teaser = hostile; d.posts[0].content = formatContent(hostile);
  const output = buildSite(d, '<div><!-- LATEST_THINKING_CARDS_START --><!-- LATEST_THINKING_CARDS_END --></div>', '<div><!-- PERSPECTIVE_CARDS_START --><!-- PERSPECTIVE_CARDS_END --></div>');
  const html = output[`theses/${d.posts[0].id}.html`];
  assert.equal(html.includes('<img src=x'), false);
  assert.ok(html.includes('&lt;img src=x'));
  const context = {};
  vm.runInNewContext(output['js/investment-theses-data.js'] + ';result=INVESTMENT_THESES;', context);
  assert.equal(context.auditMarker, undefined);
  assert.equal(context.result.find(p => p.id === d.posts[0].id).title, hostile);
  assert.equal(context.result[0].content, undefined);
  assert.equal(output['index.html'].includes('<img src=x'), false);
  assert.equal(output['investment-theses.html'].includes('&lt;img src=x'), true);
  assert.equal(Object.keys(output).length, database.posts.length + 4);
});

test('actual generator writes valid output in an isolated directory', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'faris-generation-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const output = buildSite(database, '?v=40');
  const backup = writeOutputs(root, output);
  assert.ok(fs.existsSync(path.join(backup, 'manifest.json')));
  for (const [name, value] of Object.entries(output)) assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), value);
});

test('failed replacement restores originals and retains recovery evidence', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'faris-rollback-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'a.html'), 'original');
  const io = Object.create(fs); let count = 0;
  io.renameSync = (...args) => { if (++count === 2) throw new Error('Simulated disk failure'); return fs.renameSync(...args); };
  assert.throws(() => writeOutputs(root, { 'a.html': 'changed', 'b.html': 'new' }, io), /Simulated/);
  assert.equal(fs.readFileSync(path.join(root, 'a.html'), 'utf8'), 'original');
  assert.equal(fs.existsSync(path.join(root, 'b.html')), false);
  assert.equal(fs.existsSync(path.join(root, '.publisher.lock')), false);
  assert.equal(fs.readdirSync(path.join(root, '.publisher-backups')).length, 1);
});

test('writer rejects traversal and concurrent publication', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'faris-lock-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.throws(() => writeOutputs(root, { '../escape': 'x' }), /Unsafe/);
  fs.writeFileSync(path.join(root, '.publisher.lock'), '');
  assert.throws(() => writeOutputs(root, { 'a.html': 'x' }), /EEXIST/);
});

function harness(dirty = '', branch = 'main', root) {
  const calls = [], logs = [];
  const context = { __dirname: root ? path.join(root, 'scripts') : __dirname, process: { env: {}, exitCode: 0 }, console: { log: s => logs.push(s), clear() {} }, require(name) {
    if (name === 'readline') return { createInterface: () => ({ question() {}, close() {} }) };
    if (name === 'child_process') return { execFileSync(command, args, options) {
      calls.push([command, Array.from(args)]); assert.equal(options.shell, undefined);
      return args[0] === 'status' ? dirty : args[0] === 'branch' ? branch : '';
    } };
    return require(name);
  } };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, 'publish.js'), 'utf8');
  vm.runInContext(source.slice(0, source.indexOf('// Handle CLI arguments')), context);
  return { context, calls, logs, run: () => vm.runInContext('performDeploy()', context) };
}
test('publisher refuses unreviewed working changes without staging or pushing', async () => {
  const h = harness(' M index.html'); await h.run(); assert.equal(h.context.process.exitCode, 1); assert.equal(h.calls.length, 1);
});
test('publisher only pushes clean reviewed main, never invokes Firebase or commits', async () => {
  const h = harness(); await h.run(); assert.deepEqual(h.calls.map(c => c[1][0]), ['status', 'branch', 'push']);
  const other = harness('', 'feature'); await other.run(); assert.equal(other.context.process.exitCode, 1); assert.equal(other.calls.length, 2);
});

test('actual publisher save updates JSON, generates pages and records recovery without subprocesses', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'faris-save-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'content')); fs.mkdirSync(path.join(root, 'js'));
  fs.writeFileSync(path.join(root, 'content/perspectives.json'), JSON.stringify(database));
  fs.writeFileSync(path.join(root, 'index.html'), '<link href="css/style.css?v=40">');
  fs.writeFileSync(path.join(root, 'js/components.js'), 'const Header = "?v=40";');
  const h = harness('', 'main', root);
  h.context.hostile = hostile;
  vm.runInContext('title = "Publisher regression fixture"; theme = "venture"; publishDate = "September 9, 2026"; teaserLines = [hostile]; contentLines = [hostile]; linkedinUrl = ""; savePerspective();', h.context);
  const saved = JSON.parse(fs.readFileSync(path.join(root, 'content/perspectives.json')));
  assert.equal(saved.posts.length, database.posts.length + 1);
  assert.deepEqual(saved.posts.slice(1), database.posts);
  assert.equal(saved.posts[0].content, formatContent(hostile));
  assert.equal(h.calls.length, 0);
  assert.ok(fs.readFileSync(path.join(root, 'theses/publisher-regression-fixture.html'), 'utf8').includes('&lt;img'));
  assert.ok(fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('?v=41'));
  assert.equal(fs.readdirSync(path.join(root, 'medium-export')).length, 1);
  const before = fs.readFileSync(path.join(root, 'content/perspectives.json'), 'utf8');
  assert.throws(() => vm.runInContext('savePerspective()', h.context), /Duplicate/);
  assert.equal(fs.readFileSync(path.join(root, 'content/perspectives.json'), 'utf8'), before);
});

test('server-rendered cards escape hostile titles and teasers', () => {
  const d = fixture(); d.posts[0].title = hostile; d.posts[0].teaser = hostile;
  const output = buildSite(d, '<!-- LATEST_THINKING_CARDS_START --><!-- LATEST_THINKING_CARDS_END -->', '<!-- PERSPECTIVE_CARDS_START --><!-- PERSPECTIVE_CARDS_END -->');
  for (const html of [output['index.html'], output['investment-theses.html']]) {
    assert.equal(html.includes('<img src=x'), false);
    assert.ok(html.includes('&quot;quoted&quot;'));
  }
});

test('writer detects stale prepared source instead of overwriting a newer publication', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'faris-stale-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'data.json'), 'newer');
  assert.throws(() => writeOutputs(root, { 'data.json': 'candidate' }, fs, { 'data.json': 'older' }), /Source changed/);
  assert.equal(fs.readFileSync(path.join(root, 'data.json'), 'utf8'), 'newer');
});

test('public build includes only reviewed assets, excluding content, secrets and staging', t => {
  const { buildPublic, publicFiles } = require('./build-public');
  const source = path.join(__dirname, '..');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'faris-public-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'content'));
  fs.copyFileSync(path.join(source, 'content/perspectives.json'), path.join(root, 'content/perspectives.json'));
  for (const name of publicFiles(source)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.copyFileSync(path.join(source, name), path.join(root, name));
  }
  fs.writeFileSync(path.join(root, '.env'), 'PRIVATE_FIXTURE');
  fs.writeFileSync(path.join(root, 'private-notes.html'), 'PRIVATE_FIXTURE');
  const files = buildPublic(root);
  assert.ok(files.includes('index.html'));
  assert.equal(fs.existsSync(path.join(root, 'dist/content')), false);
  assert.equal(fs.existsSync(path.join(root, 'dist/.env')), false);
  assert.equal(fs.existsSync(path.join(root, 'dist/private-notes.html')), false);
  assert.ok(files.every(name => fs.existsSync(path.join(root, 'dist', name))));
  assert.deepEqual(buildPublic(root), files);
});
test('article cover images must live under /images/covers/', () => {
  const ok = fixture();
  ok.posts[0].image = '/images/covers/example-cover.jpg';
  assert.ok(validateDatabase(ok));
  for (const bad of ['https://example.com/x.jpg', '/images/../secret.jpg', '/images/covers/x.jpg"onload="x']) {
    const db = fixture();
    db.posts[0].image = bad;
    assert.throws(() => validateDatabase(db), /Invalid article image path/);
  }
});
