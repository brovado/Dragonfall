(() => {
  const {React}=DF; const h=React.createElement;
  DF.EventLog=({log})=>h(DF.Card,{title:"Event Log",subtitle:"Newest first."},
    h("div",{className:"df-log-list"},
      (!log||log.length===0)?h("div",{className:"df-log-empty"},"No events yet."):
      log.map(l=>h("div",{key:l.id,className:"df-log-line "+(l.type==="roll"?"df-log-line--roll":l.type==="system"?"df-log-line--system":"df-log-line--story")},h("div",{className:"df-log-line__text"},l.text)))
    )
  );
})();
