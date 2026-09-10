import assert from 'node:assert/strict';
import test from 'node:test';
import { containBookArt } from '../src/lib/album/bookDesign.ts';
import type { jsPDF } from 'jspdf';

for (const [width,height] of [[2000,1000],[1000,2000]]) {
  test(`book illustration ${width}x${height} remains complete and proportional`,()=>{
    let placement:number[]=[];
    const doc={getImageProperties:()=>({width,height}),addImage:(_data:string,_format:string,...args:number[])=>{placement=args.slice(0,4);}} as unknown as jsPDF;
    containBookArt(doc,'test',10,20,120,80);
    const [x,y,w,h]=placement;
    assert.ok(x>=10&&y>=20&&x+w<=130&&y+h<=100);
    assert.equal(w/h,width/height);
  });
}
