(() => {
  DF.WEAPONS=[
    {key:"sword",name:"Sword",tagline:"Close combat • control • endurance",bias:{might:1,finesse:1,wits:0,will:0},
      styles:[{key:"guard",name:"Guard",desc:"Defense, counters, zone control."},{key:"edge",name:"Edge",desc:"Precision, crits, bleed."},{key:"fury",name:"Fury",desc:"Momentum, risk, finishing."}]},
    {key:"bow",name:"Bow",tagline:"Range • positioning • tempo",bias:{might:0,finesse:2,wits:1,will:0},
      styles:[{key:"sniper",name:"Sniper",desc:"Single-target lethality."},{key:"skirmisher",name:"Skirmisher",desc:"Mobility, rapid shots."},{key:"trapper",name:"Trapper",desc:"Terrain control, prep."}]},
    {key:"wand",name:"Wand",tagline:"Channeling • volatility • rituals",bias:{might:0,finesse:0,wits:1,will:2},
      styles:[{key:"invoker",name:"Invoker",desc:"Raw spellcasting."},{key:"binder",name:"Binder",desc:"Debuffs, wards, control."},{key:"channeler",name:"Channeler",desc:"Sustained power, scaling."}]},
  ];
})();