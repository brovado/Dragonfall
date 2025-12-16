(() => {
  const {React}=DF; const h=React.createElement; const {Button}=DF;
  DF.PrepScreen=({state,weaponObj,onChooseWeapon,onChooseStyle,onToggleClassTree})=>{
    const phase=state.phase;
    return h("div",{className:"space-y-3"},
      h("div",{className:"text-white/80 leading-relaxed"},"Dragons own the sky. Promotions require XP. Only extracted goods endure."),
      h("div",{className:"flex gap-2"},h(Button,{variant:"ghost",onClick:onToggleClassTree},state.ui.showClassTree?"Hide Class Lattice":"Show Class Lattice")),
      phase==="start" ? h("div",{className:"space-y-3"},
        h("div",{className:"text-sm text-white/60"},"Choose your starting weapon."),
        h("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3"},
          DF.WEAPONS.map(w=>h("button",{key:w.key,onClick:()=>onChooseWeapon(w.key),className:"rounded-2xl p-4 border text-left transition hover:bg-white/5 border-white/10"},
            h("div",{className:"text-lg font-semibold"},w.name),
            h("div",{className:"text-sm text-white/70 mt-1"},w.tagline)
          ))
        )
      ): null,
      phase==="chooseStyle" ? h("div",{className:"space-y-3"},
        h("div",{className:"text-sm text-white/60"},"Choose your weapon style."),
        h("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3"},
          (weaponObj?.styles||[]).map(s=>h("button",{key:s.key,onClick:()=>onChooseStyle(s.key),className:"rounded-2xl p-4 border text-left transition hover:bg-white/5 border-white/10"},
            h("div",{className:"text-lg font-semibold"},s.name),
            h("div",{className:"text-sm text-white/70 mt-1"},s.desc)
          ))
        )
      ): null
    );
  };
})();