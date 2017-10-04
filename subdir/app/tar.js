const fs = require('fs');
const child_process = require('child_process');

let packages = child_process.spawn('tar', [
    '-c',
    '--exclude', 'node_modules',
    '-s', ",^,packages/,",
    '-C', '/Users/aaron/dev/tarbaby', 'proj',
    '-C', '/Users/aaron/dev/tarbaby/subdir', 'other',
], {
  stdio: ['ignore', 'pipe', 'inherit']
});

let context = child_process.spawn('tar', [
    '-c',
    '--exclude', 'node_modules',
    'Dockerfile',
    '-C', '/Users/aaron/dev/tarbaby/subdir', 'app',
    '@-'
], {
  stdio: ['pipe', 'pipe', 'inherit']
});


packages.stdout.pipe(context.stdin);


let outStream = fs.createWriteStream('/Users/aaron/dev/tarbaby/temp.tar');
context.stdout.pipe(outStream);
