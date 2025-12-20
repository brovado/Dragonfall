(() => {
  const {React}=DF; const h=React.createElement;
  DF.PrepScreen=({state})=>{
    const phase=state.phase;
    const weaponKey=state.player.weapon;
    const styleKey=state.player.style;
    const weapon=DF.WEAPONS.find(w=>w.key===weaponKey);
    const style=weapon?.styles.find(s=>s.key===styleKey);
    return h("div",{className:"df-prep"},
      h("div",{className:"df-prep__intro"},"Dragons own the sky. Promotions require XP. Only extracted goods endure."),
      h("div",{className:"df-prep__block"},
        h("div",{className:"df-panel__section-title"},"Loadout setup runs through the log."),
        h("div",{className:"df-panel__note"},"Use the event log under the play window to pick your starting weapon and style."),
        h("div",{className:"df-info-grid"},
          h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Weapon"),h("div",{className:"df-info-value"},weapon?.name||"Pending")),
          h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Style"),h("div",{className:"df-info-value"},style?.name||"Pending"))
        ),
        phase==="start"?h("div",{className:"df-panel__note"},"Waiting for you to select a weapon in the log."):null,
        phase==="chooseStyle"?h("div",{className:"df-panel__note"},"Choose a style from the log prompt to begin your run."):null
      )
    );
  };
})();
