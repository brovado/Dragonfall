(() => {
  const {React}=DF; const h=React.createElement; const {Card,Divider,Button}=DF;
  DF.DeadScreen=({state,onMetaSpend,onWake})=>h("div",{className:"space-y-4"},
    h("div",{className:"text-white/80"},"You are dead. The Beacon collects Echoes."),
    h("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3"},
      h("div",{className:"rounded-2xl border border-white/10 p-4"},
        h("div",{className:"font-semibold"},"Beacon Upgrades"),
        h(Divider),
        h("div",{className:"space-y-2"},
          h("div",{className:"flex items-center justify-between"},
            h("div",null,h("div",{className:"text-sm font-medium"},"Start HP +1"),h("div",{className:"text-xs text-white/60"},"Cost: 6 Echoes")),
            h(Button,{variant:"ghost",onClick:()=>onMetaSpend("Start HP +1",6,(d)=>{d.meta.legacy.startHP+=1;})},"Buy")
          )
        )
      ),
      h("div",{className:"rounded-2xl border border-white/10 p-4"},
        h("div",{className:"font-semibold"},"Run Summary"),
        h(Divider),
        h("div",{className:"text-sm text-white/70"},["Depth reached: ",h("span",{className:"font-semibold text-white"},state.run.depth)])
      ),
      h("div",{className:"rounded-2xl border border-white/10 p-4"},
        h("div",{className:"font-semibold"},"Return"),
        h(Divider),
        h(Button,{onClick:onWake},"Wake at the Beacon")
      )
    )
  );
})();