const path = require('path');
const child_process = require('child_process');
const Dockerfile = require('dockerfilejs').Dockerfile;
const tar = require('tar-fs');


let packages = [
  { name: '@cardstack/other', path: '/Users/aaron/dev/tarbaby/subdir/other'},
  { name: 'proj', path: '/Users/aaron/dev/tarbaby/proj'}
];


go();
async function go() {
  let pack = await packApp();

  pack.pipe(process.stdout);

  for (let package of packages) {
    await packPackage(pack, package);
  }

  let file = new Dockerfile();
  file.from('busybox')
    .workdir('/hub')
    .copy({src: 'app', dest: 'app'})
    .copy({src: 'packages', dest: 'packages'})
    .cmd({command: 'sh'});

  pack.entry({name: 'Dockerfile'}, file.render());
  pack.finalize();
  console.log('Archive created at ./context.tar');
}

async function packApp() {
  return new Promise(function(resolve, reject) {
    let pack = tar.pack('.', {
      ignore: or(node_modules, tarfiles),
      map(header) {
        header.name = path.normalize(path.join('app', header.name));
      },
      finalize: false,
      finish: resolve
    })
    pack.on('error', reject);
  });
}

function node_modules(name) {
  return path.basename(name) === 'node_modules';
}
function tarfiles(name) {
  return path.extname(name) === '.tar';
}
function or() {
  let predicates = [].slice.call(arguments);
  return (name) => {
    return [].reduce.call(predicates, (a,b)=>a||b(name), false);
  }
}

async function packPackage(pack, package) {
  return new Promise(function(resolve, reject) {
    tar.pack(package.path, {
      pack,
      finalize: false,
      ignore: node_modules,
      map(header) {
        header.name = path.normalize(path.join('packages', package.name, header.name));
      },
      finish: resolve
    })
    pack.on('error', reject);
  });
}
