(() => {
  const {React}=DF; const h=React.createElement; const {Pill,Divider,Card}=DF;
  DF.CharacterPanel=({state,skills})=>h(Card,{title:"Character",subtitle:"Stats, skills, inventory"},
    h("div",{className:"flex flex-wrap gap-2"},h(Pill,null,`HP ${state.player.hp}/${state.player.hpMax}`),h(Pill,null,`XP ${state.player.xp}`),h(Pill,null,`Gold ${state.player.gold}`)),
    h(Divider),
    h("div",{className:"grid grid-cols-2 gap-3"},["might","finesse","wits","will"].map(k=>h("div",{key:k,className:"rounded-xl border border-white/10 p-3"},h("div",{className:"text-xs text-white/60"},k.toUpperCase()),h("div",{className:"text-lg font-semibold"},DF.fmtBonus(state.player.stats[k]))))),
    h(Divider),
    h("div",{className:"text-sm font-semibold"},"Skills"),
    h("div",{className:"space-y-2 mt-2"},skills.map(s=>h("div",{key:s.key,className:"rounded-xl border border-white/10 p-3"},h("div",{className:"flex items-center justify-between"},h("div",{className:"font-medium"},s.name),h("span",{className:"text-xs text-white/50"},s.kind)),h("div",{className:"text-xs text-white/60 mt-1"},s.desc))))
  );
})();