(() => {
  DF.skillListForBuild=(weaponKey,styleKey,elementKey,crossStyle)=>{
    const base=[];
    const attackLabel=weaponKey==="bow"?"Shoot":weaponKey==="wand"?"Cast":"Strike";
    base.push({key:"attack",name:attackLabel,kind:"action",desc:"Roll to hit. On success, deal damage."});
    base.push({key:"defend",name:"Brace",kind:"action",desc:"Raise defense this round. Reduce damage on hit."});
    base.push({key:"maneuver",name:"Maneuver",kind:"action",desc:"Reposition to set up advantage."});
    const specials={guard:{key:"riposte",name:"Shield-Check",desc:"A controlled shove. Safe, reliable."},edge:{key:"bleed",name:"Open Vein",desc:"Higher damage; risk a bite-back."},fury:{key:"lunge",name:"Lunge",desc:"Big swing; missing hurts."},sniper:{key:"aim",name:"Aim",desc:"Take a breath; next shot hits harder."},skirmisher:{key:"dash",name:"Dash Shot",desc:"Attack and slip away on success."},trapper:{key:"snare",name:"Snare",desc:"Hinder the next enemy attack."},invoker:{key:"bolt",name:"Arc Bolt",desc:"High variance magic strike."},binder:{key:"hex",name:"Hex",desc:"Weaken defenses, then hit."},channeler:{key:"focus",name:"Focus",desc:"Charge power; next roll +2."}};
    if(styleKey&&specials[styleKey]) base.push({...specials[styleKey],kind:"action"});
    if(elementKey) base.push({key:`passive_${elementKey}`,name:"Affinity",kind:"passive",desc:`${elementKey.toUpperCase()} affinity (preview).`});
    if(crossStyle) base.push({key:"cross",name:"Cross-Training",kind:"passive",desc:"You carry a second discipline."});
    return base;
  };
})();