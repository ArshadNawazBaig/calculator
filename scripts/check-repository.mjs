import {execFileSync} from 'node:child_process';

// Repository ignore rules also apply to files accidentally added with git add -f.
// Exclude personal/global ignore rules so this check is consistent in CI.
const trackedArtifacts = execFileSync('git', [
  'ls-files', '--cached', '--ignored', '--exclude-per-directory=.gitignore', '-z',
], {encoding: 'utf8'}).split('\0').filter(Boolean).sort();

if (trackedArtifacts.length) {
  console.error('Ignored files must not be tracked. Remove them from the Git index while keeping local copies:');
  for (const path of trackedArtifacts) console.error(`  ${path}`);
  process.exitCode = 1;
} else {
  console.log('Repository check passed: no ignored files are tracked.');
}
