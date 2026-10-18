import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scanner = fileURLToPath(new URL('../scripts/scan-secrets.py', import.meta.url));
async function repo(t) {
  const cwd = await mkdtemp(join(tmpdir(), 'beacon-scan-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  git('init', '-q');
  git('config', 'user.name', 'Fictional Scanner Test');
  git('config', 'user.email', 'scanner@example.invalid');
  await writeFile(join(cwd, '.env.example'), 'SUPABASE_URL=\nSUPABASE_ANON_KEY=\nSUPABASE_SERVICE_ROLE_KEY=\n');
  git('add', '.'); git('commit', '-qm', 'Blank configuration');
  const scan = () => spawnSync('python3', [scanner], { cwd, encoding: 'utf8' });
  return { cwd, git, scan };
}
test('secret scan accepts empty env examples and flags/redacts populated credential assignments', async t => {
  const { cwd, scan } = await repo(t);
  assert.equal(scan().status, 0);
  const fakeValue = 'fictional-scanner-test-value';
  await writeFile(join(cwd, '.env.bad'), `SUPABASE_SERVICE_ROLE_KEY=${fakeValue}\n`);
  const result = scan();
  assert.equal(result.status, 1);
  assert.match(result.stdout, /working tree: .env.bad/);
  assert.doesNotMatch(result.stdout, new RegExp(fakeValue));
});
test('secret scan detects synthetic token in history after working-tree deletion', async t => {
  const { cwd, git, scan } = await repo(t);
  await writeFile(join(cwd, 'fixture.txt'), ['ghp_', 'x'.repeat(36)].join(''));
  git('add', '.'); git('commit', '-qm', 'Synthetic token fixture');
  git('rm', '-q', 'fixture.txt'); git('commit', '-qm', 'Remove fixture');
  const result = scan();
  assert.equal(result.status, 1);
  assert.match(result.stdout, /history blob/);
  assert.doesNotMatch(result.stdout, /working tree: fixture/);
});
