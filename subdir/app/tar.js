const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const dockerfilejs = require('dockerfilejs');
const tarfs = require('tar-fs');
const tar = require('tar-stream');


let packages = [
  { name: '@cardstack/other', path: '/Users/aaron/dev/tarbaby/subdir/other'},
  { name: 'proj', path: '/Users/aaron/dev/tarbaby/proj'}
];


function entryStreamForPackage(package) {
  let pack = tarfs.pack(package.path, {
    ignore: (name) => name.indexOf('node_modules') !== -1,
    map: (header) => {
      let newName = path.normalize(path.join(package.name, header.name));
      header.name = newName;
      return header;
    }
  });
  return pack.pipe(tar.extract());
}

function entryStreamForApp(appPath) {
  let pack = tarfs.pack(appPath, {
    ignore: (name) => name.indexOf('node_modules') !== -1,
    map: (header) => {
      let newName = path.normalize(path.join('app', header.name));
      header.name = newName;
      return header;
    }
  });
  return pack.pipe(tar.extract());
}

let context = tar.pack();

async function pipeToContext(entryStream, prefix='') {
  console.log('gonna pipe to context');
  entryStream.on('entry', function(header, stream, next) {
    console.log('found entry', header.name);
    header.name = path.normalize(path.join(prefix, header.name));
    stream.pipe(context.entry(header, next));
  });
  console.log('added the listener');
  return new Promise(function(resolve, reject) {
    entryStream.on('finish', function(result) {
      console.log('finish', arguments);
      resolve(result);
    });
  });
}

async function go() {
  let out = context.pipe(tar.extract());

  let app = entryStreamForApp('.');
  console.log('start go');
  await pipeToContext(app);
  console.log('piped app');
  let p1 = entryStreamForPackage(packages[0]);
  await pipeToContext(p1, 'packages');
  console.log('piped p1');
  let p2 = entryStreamForPackage(packages[1]);
  await pipeToContext(p2, 'packages');
  console.log("piped p2");
  context.finalize();

  out.on('entry', function(header, stream, next) {
    console.log('header', header.name);
    next();
  });
}

go().then(function(result) {
  console.log('done', result);
}, function(err) {
  console.log('error', err);
});


/*
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
*/
