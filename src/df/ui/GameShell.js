(() => {
  const {React}=DF; const {useEffect,useMemo,useState}=React; const h=React.createElement;
  DF.GameShell=({title,subtitle,versionLabel,hudPills=[],topActions=[],keyboardHints=[],viewport,sidebar=[],bottom,children})=>{
    const [time,setTime]=useState(()=>new Date());
    const clock=useMemo(()=>time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),[time]);
    useEffect(()=>{const id=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(id);},[]);
    const safeHud=Array.isArray(hudPills)?hudPills:[]; const safeSidebar=Array.isArray(sidebar)?sidebar:[sidebar].filter(Boolean);
    return h("div",{className:"df-client-shell df-theme"},
      h("div",{className:"df-client-shell__bg","aria-hidden":"true"}),
      h("div",{className:"df-client-shell__frame"},
        h("div",{className:"df-client-shell__top"},
          h("div",{className:"df-top__left"},
            h("div",{className:"df-top__title"},title||"Dragonfall"),
            h("div",{className:"df-top__subtitle"},subtitle||`v${DF.VERSION||"dev"}`)
          ),
          h("div",{className:"df-top__center"},
            keyboardHints.length?h("div",{className:"df-top__hints"},keyboardHints.map(k=>h("span",{key:k,className:"df-hint-pill"},k))):null,
            topActions.length?h("div",{className:"df-top__actions"},topActions):null
          ),
          h("div",{className:"df-top__right"},
            h("div",{className:"df-top__meta"},versionLabel||`Version ${DF.VERSION||"dev"}`," • ",clock),
            safeHud.length?h("div",{className:"df-top__pills"},safeHud):null
          )
        ),
        h("div",{className:"df-client-shell__body"},
          h("div",{className:"df-body__grid"},
            h("div",{className:"df-body__main"},
              h("div",{className:"df-body__viewport"}, viewport||children),
              bottom?h("div",{className:"df-body__chat"},bottom):null
            ),
            h("div",{className:"df-body__sidebar"}, safeSidebar.map((s,i)=>h("div",{key:i,className:"df-sidebar__panel"},s)))
          )
        )
      )
    );
  };
})();
