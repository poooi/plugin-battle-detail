var StringDecoder,stringify
StringDecoder=require("string_decoder").StringDecoder,stringify=require("./index"),module.exports=function(r,e){var i,n,t,o,g,u
for(null==e&&(e={}),i=[],r instanceof Buffer&&(n=new StringDecoder,r=n.write(r)),u=new stringify.Stringifier(e),u.push=function(r){return r?i.push(r.toString()):void 0},t=0,o=r.length;o>t;t++)g=r[t],u.write(g)
return u.end(),i.join("")}
