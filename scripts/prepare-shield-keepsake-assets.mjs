import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const files=process.argv.slice(2);
if(files.length!==3)throw Error('Pass certificate, recipe and labels background PNG paths, in that order.');
const destination='public/examples/scut/keepsakes';
await mkdir(destination,{recursive:true});
for(const [i,name] of ['certificate','recipe','labels'].entries()){
 const output=`${destination}/${name}.webp`;
 const info=await sharp(files[i]).webp({quality:94}).toFile(output);
 console.log({output,width:info.width,height:info.height,bytes:info.size});
}
