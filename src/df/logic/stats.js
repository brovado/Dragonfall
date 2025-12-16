(() => {
  DF.computeStats=(base,weaponBias,styleKey,elementKey,crossKey)=>{
    const s={...base};
    for(const k of Object.keys(weaponBias||{})) s[k]=(s[k]||0)+weaponBias[k];
    if(styleKey){
      const map={guard:{might:1},edge:{finesse:1},fury:{might:1},sniper:{finesse:1,wits:1},skirmisher:{finesse:1},trapper:{wits:2},invoker:{wits:1,will:1},binder:{wits:1,will:1},channeler:{will:2}};
      const add=map[styleKey]||{}; for(const k of Object.keys(add)) s[k]=(s[k]||0)+add[k];
    }
    if(elementKey){
      const map={fire:{might:1},ice:{finesse:1},storm:{will:1},earth:{might:1},void:{will:1}};
      const add=map[elementKey]||{}; for(const k of Object.keys(add)) s[k]=(s[k]||0)+add[k];
    }
    if(crossKey){ s.wits=(s.wits||0)+1; s.finesse=(s.finesse||0)+1; s.might=(s.might||0)-1; }
    s.might=DF.clamp(s.might||0,-1,6); s.finesse=DF.clamp(s.finesse||0,-1,6); s.wits=DF.clamp(s.wits||0,-1,6); s.will=DF.clamp(s.will||0,-1,6);
    return s;
  };
  DF.computeAttackMod=(stats,weaponKey)=>{
    if(weaponKey==="sword") return stats.might+Math.floor(stats.finesse/2);
    if(weaponKey==="bow") return stats.finesse+Math.floor(stats.wits/2);
    if(weaponKey==="wand") return stats.will+Math.floor(stats.wits/2);
    return 0;
  };
  DF.computeDefenseMod=(stats,styleKey)=>{
    let mod=Math.floor((stats.might+stats.will)/2);
    if(styleKey==="guard"||styleKey==="trapper"||styleKey==="binder") mod+=1;
    return mod;
  };
  DF.titleFromBuild=(weaponKey,styleKey,elementKey,crossStyle)=>{
    const weapon=DF.WEAPONS.find(w=>w.key===weaponKey)?.name||"";
    const style=DF.WEAPONS.flatMap(w=>w.styles).find(s=>s.key===styleKey)?.name||"";
    const el=DF.ELEMENTS.find(e=>e.key===elementKey)?.name||"";
    if(!weaponKey) return "Unbound";
    if(!styleKey) return weapon;
    if(crossStyle){
      const crossName=DF.WEAPONS.flatMap(w=>w.styles).find(s=>s.key===crossStyle)?.name||"Cross";
      return `${weapon} ${style} • ${crossName}`;
    }
    if(elementKey) return `${el}${weapon} ${style}`;
    return `${weapon} ${style}`;
  };
})();