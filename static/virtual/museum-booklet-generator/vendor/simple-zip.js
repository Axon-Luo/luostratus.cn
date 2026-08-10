(function(global){
  "use strict";
  const table=new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c=n;
    for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;
    table[n]=c>>>0;
  }
  const crc32=bytes=>{
    let crc=0xffffffff;
    for(const value of bytes)crc=table[(crc^value)&0xff]^(crc>>>8);
    return (crc^0xffffffff)>>>0;
  };
  const u16=value=>new Uint8Array([value&255,(value>>>8)&255]);
  const u32=value=>new Uint8Array([value&255,(value>>>8)&255,(value>>>16)&255,(value>>>24)&255]);
  const join=parts=>{
    const size=parts.reduce((sum,part)=>sum+part.length,0),output=new Uint8Array(size);
    let offset=0;
    for(const part of parts){output.set(part,offset);offset+=part.length}
    return output;
  };
  const dosDateTime=date=>{
    const year=Math.max(1980,date.getFullYear());
    return {
      time:(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1),
      date:((year-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate()
    };
  };
  async function toBytes(data){
    if(data instanceof Uint8Array)return data;
    if(data instanceof ArrayBuffer)return new Uint8Array(data);
    if(data instanceof Blob)return new Uint8Array(await data.arrayBuffer());
    return new TextEncoder().encode(String(data??""));
  }
  async function create(files){
    const locals=[],centrals=[];
    let offset=0;
    for(const file of files){
      const name=new TextEncoder().encode(String(file.name||"file.bin"));
      const bytes=await toBytes(file.data);
      const crc=crc32(bytes),stamp=dosDateTime(file.date||new Date());
      const local=join([u32(0x04034b50),u16(20),u16(0),u16(0),u16(stamp.time),u16(stamp.date),u32(crc),u32(bytes.length),u32(bytes.length),u16(name.length),u16(0),name,bytes]);
      locals.push(local);
      const central=join([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(stamp.time),u16(stamp.date),u32(crc),u32(bytes.length),u32(bytes.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
      centrals.push(central);offset+=local.length;
    }
    const centralData=join(centrals);
    const end=join([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralData.length),u32(offset),u16(0)]);
    return new Blob([join([...locals,centralData,end])],{type:"application/zip"});
  }
  global.OCSimpleZip={create};
})(window);
