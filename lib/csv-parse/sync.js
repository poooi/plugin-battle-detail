var StringDecoder,parse
StringDecoder=require("string_decoder").StringDecoder,parse=require("./index"),module.exports=function(e,r){var n,i,t
return null==r&&(r={}),t=r.objname?{}:[],e instanceof Buffer&&(n=new StringDecoder,e=n.write(e)),i=new parse.Parser(r),i.push=function(e){return r.objname?t[e[0]]=e[1]:t.push(e)},i.__write(e,!1),e instanceof Buffer&&i.__write(e.end(),!0),i._flush(function(){}),t}
