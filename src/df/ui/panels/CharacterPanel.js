(() => {
  const {React}=DF; const h=React.createElement; const {Pill,Divider,Card}=DF;
  DF.CharacterPanel=({state,skills})=>h(Card,{title:"Character",subtitle:"Stats, skills, inventory"},
    h("div",{className:"df-chip-row"},h(Pill,null,`HP ${state.player.hp}/${state.player.hpMax}`),h(Pill,null,`XP ${state.player.xp}`),h(Pill,null,`Gold ${state.player.gold}`)),
    h(Divider),
    h("div",{className:"df-stat-grid"},["might","finesse","wits","will"].map(k=>h("div",{key:k,className:"df-stat-block"},h("div",{className:"df-stat-label"},k.toUpperCase()),h("div",{className:"df-stat-value"},DF.fmtBonus(state.player.stats[k]))))),
    h(Divider),
    h("div",{className:"df-panel__section-title"},"Skills"),
    h("div",{className:"df-skill-list"},skills.map(s=>h("div",{key:s.key,className:"df-skill-card"},h("div",{className:"df-skill-card__top"},h("div",{className:"df-skill-card__title"},s.name),h("span",{className:"df-skill-card__kind"},s.kind)),h("div",{className:"df-skill-card__desc"},s.desc))))
  );
})();
