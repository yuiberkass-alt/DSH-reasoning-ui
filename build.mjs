import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('./', import.meta.url);
const sprites = await Promise.all(['idle','start','run','stop'].map(async name => {
  const bytes = await readFile(new URL(`assets/${name}.png`, root));
  if(bytes.toString('ascii',1,4)!=='PNG')throw new Error(`Invalid PNG: ${name}`);
  return {url:'data:image/png;base64,'+bytes.toString('base64'), width:bytes.readUInt32BE(16), height:bytes.readUInt32BE(20)};
}));
const source = await readFile(new URL('src/client.template.js', root), 'utf8');
if (!source.includes('__SPRITE_SET__')) throw new Error('Missing asset marker');
await writeFile(new URL('client.js', root), source.replace("'__SPRITE_SET__'", JSON.stringify(sprites)));
console.log('Built @local/dsh-chibi-slider (all artwork embedded; no external requests).');
