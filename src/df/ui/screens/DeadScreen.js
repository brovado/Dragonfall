(() => {
  const {React}=DF; const h=React.createElement; const {Card,Divider,Button}=DF;
  DF.DeadScreen=({state,onMetaSpend,onWake})=>h("div",{className:"df-prep df-prep--dead"},
    h("div",{className:"df-prep__intro"},"You are dead. The Beacon collects Echoes."),
    h("div",{className:"df-option-grid df-option-grid--three"},
      h("div",{className:"df-option-card df-option-card--solid"},
        h("div",{className:"df-option-card__title"},"Beacon Upgrades"),
        h(Divider),
        h("div",{className:"df-upgrade-row"},
          h("div",null,h("div",{className:"df-upgrade-row__title"},"Start HP +1"),h("div",{className:"df-upgrade-row__meta"},"Cost: 6 Echoes")),
            h(Button,{variant:"ghost",onClick:()=>onMetaSpend("Start HP +1",6,(d)=>{d.meta.legacy.startHP+=1;})},"Buy")
          )
        )
      ),
      h("div",{className:"df-option-card df-option-card--solid"},
        h("div",{className:"df-option-card__title"},"Run Summary"),
        h(Divider),
        h("div",{className:"df-panel__note"},["Depth reached: ",h("span",{className:"df-strong"},state.run.depth)])
      ),
      h("div",{className:"df-option-card df-option-card--solid"},
        h("div",{className:"df-option-card__title"},"Return"),
        h(Divider),
        h(Button,{onClick:onWake},"Wake at the Beacon")
      )
    )
  );
})();
