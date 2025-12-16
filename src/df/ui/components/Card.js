(() => {
  const {React}=DF; const h=React.createElement;
  DF.Card=({title,subtitle,children,right})=>h("div",{className:"rounded-2xl bg-white/5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"},
    h("div",{className:"px-4 py-3 border-b border-white/10 flex items-start justify-between gap-3"},
      h("div",null,h("div",{className:"text-lg font-semibold tracking-tight"},title),subtitle?h("div",{className:"text-sm text-white/70 mt-0.5"},subtitle):null),
      right?h("div",{className:"shrink-0"},right):null
    ),
    h("div",{className:"p-4"},children)
  );
})();