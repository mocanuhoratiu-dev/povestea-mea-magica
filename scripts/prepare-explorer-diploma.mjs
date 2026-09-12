import sharp from 'sharp';
const [source] = process.argv.slice(2);
if (!source) throw Error('Pass the approved nameless diploma PNG.');
const metadata = await sharp(source).metadata();
if (Math.abs(metadata.width / metadata.height - 297 / 210) > .02) throw Error('Expected the full uncropped A4 landscape composition.');
const info = await sharp(source).webp({ quality: 94 }).toFile('public/examples/kits-v2/explorer-diploma-map.webp');
console.log({ width: info.width, height: info.height, bytes: info.size });
