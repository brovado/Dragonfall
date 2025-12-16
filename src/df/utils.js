(() => {
  DF.clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  DF.uid=()=>Math.random().toString(16).slice(2)+Date.now().toString(16);
  DF.fmtBonus=(b)=>b===0?"+0":(b>0?`+${b}`:`${b}`);
  DF.pick=(arr,rng)=>arr[Math.floor(rng()*arr.length)];
})();