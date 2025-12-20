(() => {
  const {React}=DF; const h=React.createElement; const {Button,Divider}=DF;
  DF.PromotionModal=({state,onLater,onChooseElement,onChooseCross})=>{
    if(!(state.phase==="play"&&state.ui.showPromotion)) return null;
    return h("div",{className:"df-modal"},
      h("div",{className:"df-modal__panel"},
        h("div",{className:"df-modal__top"},
          h("div",null,h("div",{className:"df-modal__title"},"Promotion Unlocked"),h("div",{className:"df-modal__subtitle"},"Choose: Element or Cross-Training.")),
          h(Button,{variant:"ghost",onClick:onLater},"Later")
        ),
        h(Divider),
        h("div",{className:"df-option-grid"},
          h("div",{className:"df-option-card df-option-card--solid"},
            h("div",{className:"df-option-card__title"},"Bind an Element"),
            h("div",{className:"df-option-grid"},
              DF.ELEMENTS.map(e=>h(Button,{key:e.key,variant:"ghost",onClick:()=>onChooseElement(e.key)},e.name))
            )
          ),
          h("div",{className:"df-option-card df-option-card--solid"},
            h("div",{className:"df-option-card__title"},"Cross-Train a Style"),
            h("div",{className:"df-option-grid"},
              DF.WEAPONS.flatMap(w=>w.styles).filter(s=>s.key!==state.player.style).slice(0,8).map(s=>h(Button,{key:s.key,variant:"ghost",onClick:()=>onChooseCross(s.key)},s.name))
            )
          )
        )
      )
    );
  };
})();
