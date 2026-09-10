import type { jsPDF } from 'jspdf';
import type { AlbumConfiguration, AlbumScene } from './types.ts';

const W=210,H=148;
const paper='#fffefa',plum='#402746',forest='#20594f',rose='#eadfe7',sage='#e8eee3',ink='#293c3b',gold='#dfc590';
function background(doc:jsPDF,color:string){doc.setFillColor(color);doc.rect(0,0,W,H,'F');}
function type(doc:jsPDF,size:number,color=ink,serif=true){doc.setFont(serif?'AlbumSerif':'Liberation','normal');doc.setFontSize(size);doc.setTextColor(color);}
function fitted(doc:jsPDF,text:string,width:number,height:number,size:number,min:number,color=ink,serif=true){
  for(let s=size;s>=min;s-=.5){type(doc,s,color,serif);const lines=doc.splitTextToSize(text,width) as string[];const leading=s*.3528*1.25;
    if(lines.every(line=>doc.getTextWidth(line)<=width+.1)&&lines.length*leading<=height)return{lines,size:s,leading,height:lines.length*leading};
  }throw new Error('album_editorial_text_overflow');
}
function textBlock(doc:jsPDF,text:string,x:number,y:number,width:number,height:number,size:number,min:number,color=ink,serif=true){
  const fit=fitted(doc,text,width,height,size,min,color,serif);doc.text(fit.lines,x,y+fit.size*.3528,{lineHeightFactor:1.25});return fit.height;
}
/** Complete source image: never a face-aware crop, stretch or decorative repeated crop. */
export function containBookArt(doc:jsPDF,image:string,x:number,y:number,w:number,h:number){
  const info=doc.getImageProperties(image),scale=Math.min(w/info.width,h/info.height),iw=info.width*scale,ih=info.height*scale;
  doc.addImage(image,'JPEG',x+(w-iw)/2,y+(h-ih)/2,iw,ih,undefined,'MEDIUM');
}
function star(doc:jsPDF,x:number,y:number,size=1.3,color=gold){doc.setFillColor(color);doc.triangle(x,y-size,x-.4,y,x,y+size,'F');doc.triangle(x,y-size,x+.4,y,x,y+size,'F');doc.triangle(x-size,y,x,y-.4,x+size,y,'F');doc.triangle(x-size,y,x,y+.4,x+size,y,'F');}
function folio(doc:jsPDF,n:number,dark=false){const color=dark?'#cfc3cd':'#6c7d72';doc.setDrawColor(dark?'#79627c':'#cbd5c7');doc.setLineWidth(.2);doc.line(12,138,198,138);type(doc,6.5,color,false);doc.text('Povestea Mea Magică',12,143);doc.text(String(n).padStart(2,'0'),198,143,{align:'right'});}

export function drawBookCover(doc:jsPDF,image:string,title:string,childName:string,logo:string,activity=false){
  background(doc,plum);
  type(doc,6.5,gold,false);doc.text('POVESTEA MEA MAGICĂ',105,10,{align:'center'});
  const t=fitted(doc,title,184,28,29,18,paper);doc.text(t.lines,105,17+t.size*.3528,{align:'center',lineHeightFactor:1.25});
  const subtitleY=26+t.height;
  type(doc,10,gold);doc.text(`${activity?'Trei misiuni':'O aventură'} pentru ${childName}`,105,subtitleY,{align:'center'});
  containBookArt(doc,image,0,subtitleY+5,210,134-subtitleY);
  type(doc,6,paper,false);doc.text(activity?'COLORAT  ·  LABIRINT  ·  GĂSEȘTE DIFERENȚELE':'POVESTEA MAGICĂ  ·  O CARTE DE DESCOPERIT ÎMPREUNĂ',105,145,{align:'center'});
}

export function drawBookDedication(doc:jsPDF,config:AlbumConfiguration,logo:string,lumi:string){
  background(doc,paper);doc.setFillColor(sage);doc.rect(0,0,75,H,'F');
  type(doc,7,forest,false);doc.text('ACEASTĂ POVESTE ÎI APARȚINE LUI',10,18);
  type(doc,84,forest);doc.text(config.generation.name.charAt(0).toLocaleUpperCase('ro-RO'),37.5,64,{align:'center'});
  const name=fitted(doc,config.generation.name,59,28,24,13,forest);doc.text(name.lines,37.5,78,{align:'center',lineHeightFactor:1.25});
  star(doc,37.5,111,2,forest);type(doc,9,forest);doc.text('O lume numai a ta.',37.5,123,{align:'center'});
  type(doc,7,plum,false);doc.text('DIN PARTEA CELOR CARE TE IUBESC',89,25);
  const message=config.dedication||`Pentru ${config.generation.name}, cu drag și cu lumină pentru fiecare aventură.`;
  textBlock(doc,message,89,38,105,59,19,13,plum);
  if(config.dedicationFrom)textBlock(doc,config.dedicationFrom,89,106,75,21,13,10,forest);
  doc.addImage(lumi,'PNG',172,104,18,28);
  type(doc,6.5,'#697a71',false);doc.text('Povestea Mea Magică',89,141);
}

export function drawBookScene(doc:jsPDF,image:string,scene:AlbumScene,n:number,final:boolean){
  let side=n%3===2&&!final;
  if(side){try{const h=fitted(doc,scene.heading,57,37,24,16);fitted(doc,scene.text,57,96-h.height,14,11);}catch{side=false;}}
  const dark=side||final;
  const accent=final?forest:plum;
  background(doc,dark?accent:n%3===0?sage:paper);
  if(side){
    type(doc,7,gold,false);doc.text(`POVESTEA CONTINUĂ · ${String(n).padStart(2,'0')}`,12,16);
    const heading=fitted(doc,scene.heading,57,37,24,16,paper);
    const body=fitted(doc,scene.text,57,96-heading.height,14,11,paper);
    const top=24+Math.max(0,(102-heading.height-body.height-5)/2);
    textBlock(doc,scene.heading,12,top,57,37,24,16,paper);
    textBlock(doc,scene.text,12,top+5+heading.height,57,96-heading.height,14,11,paper);
    containBookArt(doc,image,77,19,125,104);
    star(doc,138,128,1.5,gold);
  }else{
    const body=fitted(doc,scene.text,120,final?53:64,15,12);
    const imageHeight=Math.min(95,(final?120:126)-body.height);
    containBookArt(doc,image,0,0,210,imageHeight);
    type(doc,6.5,dark?gold:forest,false);doc.text(final?'ULTIMA PAGINĂ A AVENTURII':`CAPITOLUL ${String(n).padStart(2,'0')}`,12,imageHeight+7);
    textBlock(doc,scene.heading,12,imageHeight+11,58,123-imageHeight,22,15,dark?paper:plum);
    textBlock(doc,scene.text,78,imageHeight+6,120,body.height+.1,body.size,body.size,dark?paper:ink);
    if(final){type(doc,15,gold);doc.text('Sfârșit',198,134,{align:'right'});}
  }
  folio(doc,n,dark);
}

export function drawBookBack(doc:jsPDF,logo:string,lumi:string){
  background(doc,forest);
  type(doc,7,gold,false);doc.text('POVESTEA MEA MAGICĂ',105,18,{align:'center'});
  type(doc,35,paper);doc.text('O poveste se încheie.',105,44,{align:'center'});doc.text('Curiozitatea rămâne.',105,60,{align:'center'});
  type(doc,12,'#e0eadd');doc.text('Pentru toate lumile pe care le veți descoperi împreună.',105,77,{align:'center'});
  doc.addImage(lumi,'PNG',92,86,26,40);
  star(doc,78,107,2);star(doc,132,104,1.5);
  type(doc,7,paper,false);doc.text('povestea-mea-magica.ro',105,140,{align:'center'});
}
