#!/usr/bin/env python3
"""Redacted pattern scan of nonignored files and all reachable Git blobs.
A baseline check, not a guarantee that arbitrary secrets can be recognized.
"""
import pathlib
import re
import subprocess
import sys

PATTERNS = [
    re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(rb'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b'),
    re.compile(rb'\bsb_secret_[A-Za-z0-9_-]{12,}\b'),
    re.compile(rb'\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b'),
    re.compile(rb'\bAKIA[0-9A-Z]{16}\b'),
    re.compile(rb'(?m)^[ \t]*(?:export[ \t]+)?(?:[A-Z_]*SUPABASE[A-Z_]*(?:KEY|TOKEN)|DATABASE_URL|PGPASSWORD)[ \t]*=[ \t]*[^\s\r\n#][^\r\n]*'),
]

def git(*args):
    return subprocess.check_output(['git', *args])

def flagged(data):
    return any(pattern.search(data) for pattern in PATTERNS)

findings = []
paths = set(git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split(b'\0'))
for raw in paths:
    if not raw:
        continue
    path = pathlib.Path(raw.decode())
    if path.is_file() and flagged(path.read_bytes()):
        findings.append(f'working tree: {path}')
blobs = 0
for line in git('rev-list', '--objects', '--all').splitlines():
    oid, _, name = line.partition(b' ')
    if git('cat-file', '-t', oid.decode()).strip() != b'blob':
        continue
    blobs += 1
    if flagged(git('cat-file', '-p', oid.decode())):
        findings.append(f'history blob {oid.decode()[:12]}: {name.decode(errors="replace")}')
if findings:
    print('Potential secrets found (values redacted):')
    print('\n'.join(findings))
    sys.exit(1)
print(f'PASS: scanned {len(paths) - 1} working-tree paths and {blobs} reachable Git blobs; no pattern matches.')
print('Scope: private keys, JWTs, Supabase secret keys, common tokens, and credential environment assignments.')
