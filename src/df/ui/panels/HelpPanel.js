(() => {
  const {React}=DF; const h=React.createElement;
  DF.HelpPanel=()=>h(DF.Card,{title:"Help",subtitle:"How this preview works"},
    h("div",{className:"df-help-list"},
      h("div",null,h("span",{className:"font-semibold text-white"},"Map:")," click a revealed node to move."),
      h("div",null,h("span",{className:"font-semibold text-white"},"Fights:")," give loot + XP."),
      h("div",null,h("span",{className:"font-semibold text-white"},"Promotion:")," at 4 XP, choose Element OR Cross."),
      h("div",null,h("span",{className:"font-semibold text-white"},"Extraction:")," only extracted loot is permanent.")
    )
  );
})();
