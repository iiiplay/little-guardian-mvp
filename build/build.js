#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
const sources = {
  ASSETS_JS: 'const ASSETS = ' + JSON.stringify(Object.fromEntries(fs.readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.png')).map(f=>[f.replace('.png',''), 'data:image/png;base64,'+fs.readFileSync(path.join(root,'assets',f)).toString('base64')]))) + ';',
  ENGINE_JS: read('engine/engine.js'),
  DRIVER_JS: read('src/driver.js'),
  EQUIPMENT_JS: read('src/equipment.js'),
  CORE_JS: read('src/core.js'),
  RENDER_JS: read('src/render.js'),
  AUDIO_JS: read('src/audio.js'),
  UI_JS: read('src/ui.js'),
  GEAR_UI_JS: read('src/gear-ui.js'),
  TREASURE_UI_JS: read('src/treasure-ui.js'),
  FORGE_UI_JS: read('src/forge-ui.js'),
};

let output = read('src/template.html');
for (const [name, source] of Object.entries(sources)) {
  if (source.toLowerCase().includes('</script')) throw new Error(`${name} contains </script`);
  const marker = `<!--${name}-->`;
  if (output.split(marker).length !== 2) throw new Error(`${marker} must appear exactly once`);
  output = output.replace(marker, () => source);
}
if (/<!--(?:ENGINE|DRIVER|CORE)_JS-->/.test(output)) throw new Error('Unresolved placeholder');

const destination = path.join(root, 'dist', 'game.html');
fs.mkdirSync(path.dirname(destination), { recursive: true });
const temporary = `${destination}.tmp-${process.pid}`;
fs.writeFileSync(temporary, output, 'utf8');
fs.renameSync(temporary, destination);
console.log(`Built ${destination}`);
// Keep every build artifact inside this project's own directory.
const entry = path.join(root, 'index.html');
fs.writeFileSync(entry + '.tmp', output, 'utf8');
fs.renameSync(entry + '.tmp', entry);
console.log(`Built ${entry}`);
