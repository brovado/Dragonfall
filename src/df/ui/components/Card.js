(() => {
  const {React}=DF; const h=React.createElement;
  DF.Card=({title,subtitle,children,right})=>h("div",{className:"df-panel"},
    h("div",{className:"df-panel__header"},
      h("div",{className:"df-panel__titles"},
        h("div",{className:"df-panel__title"},title||""),
        subtitle?h("div",{className:"df-panel__subtitle"},subtitle):null
      ),
      right?h("div",{className:"df-panel__right"},right):null
    ),
    h("div",{className:"df-panel__body"},children)
  );
})();
