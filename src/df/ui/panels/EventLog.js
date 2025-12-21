(() => {
  const {React}=DF; const h=React.createElement;
  const renderChoice=(entry,choice,onPromptChoice)=>h("button",{
    key:choice.id,
    className:"df-log-choice",
    disabled:entry.resolved,
    onClick:()=>{if(typeof onPromptChoice==="function") onPromptChoice(entry.id,choice);}
  },
    h("div",{className:"df-log-choice__label"},choice.label||choice.id),
    choice.sub?h("div",{className:"df-log-choice__sub"},choice.sub):null
  );
  DF.EventLog=({log,onPromptChoice})=>{
    const lines=Array.isArray(log)?[...log].sort((a,b)=>(b?.t||0)-(a?.t||0)):[];
    return h("div",{className:"df-dialog-log"},
      (!lines||lines.length===0)?h("div",{className:"df-log-empty"},"Awaiting input…"):
      lines.map(l=>{
        const cls=["df-log-line"];
        if(l.type==="roll") cls.push("df-log-line--roll");
        else if(l.type==="system") cls.push("df-log-line--system");
        else cls.push("df-log-line--story");
        if(l.type==="prompt") cls.push("df-log-line--prompt");
        if(l.resolved) cls.push("df-log-line--resolved");
        return h("div",{key:l.id||l.t,className:cls.join(" ")},
          h("div",{className:"df-log-line__text"},l.text),
          l.type==="prompt"&&Array.isArray(l.choices)?h("div",{className:"df-log-line__actions"},l.choices.map(c=>renderChoice(l,c,onPromptChoice))):null,
          l.resolved?h("div",{className:"df-log-line__resolved"},"Resolved"):null
        );
      })
    );
  };
})();
