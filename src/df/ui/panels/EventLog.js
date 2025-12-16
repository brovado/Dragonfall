(() => {
  const {React}=DF; const h=React.createElement;
  DF.EventLog=({log})=>h(DF.Card,{title:"Event Log",subtitle:"Newest first."},
    h("div",{className:"space-y-2"},
      (!log||log.length===0)?h("div",{className:"text-white/60 text-sm"},"No events yet."):
      log.map(l=>h("div",{key:l.id,className:"rounded-xl border px-3 py-2 text-sm "+(l.type==="roll"?"border-amber-400/20 bg-amber-500/10":l.type==="system"?"border-white/10 bg-white/5":"border-indigo-400/20 bg-indigo-500/10")},h("div",{className:"text-white/90"},l.text)))
    )
  );
})();