(() => {
  const {React}=DF; const {useEffect,useMemo,useState}=React; const h=React.createElement;
  DF.GameShell=({title,subtitle,versionLabel,hudPills=[],keyboardHints=[],viewport,sidebar=[],bottom,children,sidebarCollapsed=false,onToggleSidebar})=>{
    const [time,setTime]=useState(()=>new Date());
    const clock=useMemo(()=>time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),[time]);
    useEffect(()=>{const id=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(id);},[]);
    const safeHud=Array.isArray(hudPills)?hudPills:[]; const safeSidebar=Array.isArray(sidebar)?sidebar:[sidebar].filter(Boolean);
    const shellClass=["df-client-shell","df-theme",sidebarCollapsed?"df-client-shell--sidebar-collapsed":null].filter(Boolean).join(" ");
    const handleToggle=typeof onToggleSidebar==="function"?onToggleSidebar:()=>{};
    const railToggle=h("button",{className:"df-sidebar__rail-button",onClick:handleToggle,type:"button"},sidebarCollapsed?"◀":"▶");
    const collapseToggle=h("button",{className:"df-sidebar__collapse-button",onClick:handleToggle,type:"button"},sidebarCollapsed?"Expand Sidebar":"Collapse Sidebar");
    return h("div",{className:shellClass},
      h("div",{className:"df-client-shell__bg","aria-hidden":"true"}),
      h("div",{className:"df-client-shell__frame"},
        h("div",{className:"df-client-shell__top"},
          h("div",{className:"df-top__left"},
            h("div",{className:"df-top__title"},title||"Dragonfall"),
            h("div",{className:"df-top__subtitle"},subtitle||`v${DF.VERSION||"dev"}`)
          ),
          h("div",{className:"df-top__right"},
            h("div",{className:"df-top__meta"},versionLabel||`Version ${DF.VERSION||"dev"}`," • ",clock),
            keyboardHints.length?h("div",{className:"df-top__hints"},keyboardHints.map(k=>h("span",{key:k,className:"df-hint-pill"},k))):null,
            safeHud.length?h("div",{className:"df-top__pills"},safeHud):null
          )
        ),
        h("div",{className:"df-client-shell__body"},
          h("div",{className:"df-body__grid"},
            h("div",{className:"df-body__main"},
              h("div",{className:"df-body__viewport"}, viewport||children),
              bottom?h("div",{className:"df-body__chat"},bottom):null
            ),
            h("div",{className:"df-body__sidebar"},
              h("div",{className:"df-sidebar__stack"},
                h("div",{className:"df-sidebar__collapse-row"},
                  h("div",{className:"df-sidebar__label"},"Sidebar"),
                  collapseToggle
                ),
                safeSidebar.map((s,i)=>h("div",{key:i,className:"df-sidebar__item"},s))
              ),
              h("div",{className:"df-sidebar__rail"},railToggle)
            )
          )
        )
      )
    );
  };
})();
