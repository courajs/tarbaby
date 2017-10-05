const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const dockerfilejs = require('dockerfilejs');
const tar = require('tar-fs');


let packages = [
  { name: '@cardstack/other', path: '/Users/aaron/dev/tarbaby/subdir/other'},
  { name: 'proj', path: '/Users/aaron/dev/tarbaby/proj'}
];


go();
async function go() {
  let pack = await packApp();

  let outStream = fs.createWriteStream('context.tar');
  pack.pipe(outStream);

  for (let package of packages) {
    await packPackage(pack, package);
  }
  pack.entry({name: 'generated.txt'}, 'hello');
  pack.finalize();
  console.log('wow! done.');
}

async function packApp() {
  return new Promise(function(resolve, reject) {
    let pack = tar.pack('.', {
      ignore: or(node_modules, tarfiles),
      map(header) {
        let newName = path.normalize(path.join('app', header.name));
        console.log('app mapping', header.name, 'to', newName);
        header.name = newName;
        return header;
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
        let newName = path.normalize(path.join(package.name, header.name));
        console.log('package mapping', header.name, 'to', newName);
        header.name = newName;
        return header;
      },
      finish: resolve
    })
    pack.on('error', reject);
  });
}
