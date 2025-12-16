(() => {
  const {React}=DF; const h=React.createElement; const {Button,Divider}=DF;
  DF.PromotionModal=({state,onLater,onChooseElement,onChooseCross})=>{
    if(!(state.phase==="play"&&state.ui.showPromotion)) return null;
    return h("div",{className:"fixed inset-0 bg-black/60 flex items-center justify-center p-4"},
      h("div",{className:"max-w-2xl w-full rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur p-4"},
        h("div",{className:"flex items-start justify-between gap-3"},
          h("div",null,h("div",{className:"text-xl font-semibold"},"Promotion Unlocked"),h("div",{className:"text-sm text-white/70 mt-1"},"Choose: Element or Cross-Training.")),
          h(Button,{variant:"ghost",onClick:onLater},"Later")
        ),
        h(Divider),
        h("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3"},
          h("div",{className:"rounded-2xl border border-white/10 p-4 bg-white/5"},
            h("div",{className:"font-semibold"},"Bind an Element"),
            h("div",{className:"grid grid-cols-2 gap-2 mt-3"},
              DF.ELEMENTS.map(e=>h(Button,{key:e.key,variant:"ghost",onClick:()=>onChooseElement(e.key)},e.name))
            )
          ),
          h("div",{className:"rounded-2xl border border-white/10 p-4 bg-white/5"},
            h("div",{className:"font-semibold"},"Cross-Train a Style"),
            h("div",{className:"grid grid-cols-2 gap-2 mt-3"},
              DF.WEAPONS.flatMap(w=>w.styles).filter(s=>s.key!==state.player.style).slice(0,8).map(s=>h(Button,{key:s.key,variant:"ghost",onClick:()=>onChooseCross(s.key)},s.name))
            )
          )
        )
      )
    );
  };
})();