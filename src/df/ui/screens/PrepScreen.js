(() => {
  const {React}=DF; const h=React.createElement; const {Button}=DF;
  DF.PrepScreen=({state,weaponObj,onChooseWeapon,onChooseStyle,onToggleClassTree})=>{
    const phase=state.phase;
    return h("div",{className:"df-prep"},
      h("div",{className:"df-prep__intro"},"Dragons own the sky. Promotions require XP. Only extracted goods endure."),
      h("div",{className:"df-chip-row"},h(Button,{variant:"ghost",onClick:onToggleClassTree},state.ui.showClassTree?"Hide Class Lattice":"Show Class Lattice")),
      phase==="start" ? h("div",{className:"df-prep__block"},
        h("div",{className:"df-panel__section-title"},"Choose your starting weapon."),
        h("div",{className:"df-option-grid"},
          DF.WEAPONS.map(w=>h("button",{key:w.key,onClick:()=>onChooseWeapon(w.key),className:"df-option-card"},
            h("div",{className:"df-option-card__title"},w.name),
            h("div",{className:"df-option-card__desc"},w.tagline)
          ))
        )
      ): null,
      phase==="chooseStyle" ? h("div",{className:"df-prep__block"},
        h("div",{className:"df-panel__section-title"},"Choose your weapon style."),
        h("div",{className:"df-option-grid"},
          (weaponObj?.styles||[]).map(s=>h("button",{key:s.key,onClick:()=>onChooseStyle(s.key),className:"df-option-card"},
            h("div",{className:"df-option-card__title"},s.name),
            h("div",{className:"df-option-card__desc"},s.desc)
          ))
        )
      ): null
    );
  };
})();
