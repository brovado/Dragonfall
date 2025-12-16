(() => {
  const {React}=DF; const h=React.createElement; const {Pill,Button,Divider}=DF;
  DF.PlayScreen=({state,weaponObj,styleObj,elementObj,skills,currentNode,canExtractHere,onMoveToNode,onRest,onBuildStation,onExtract,onCombatAction})=>{
    return h("div",{className:"space-y-3"},
      h("div",{className:"flex flex-wrap gap-2"},
        h(Pill,null,`Title: ${state.player.title}`),
        h(Pill,null,`Weapon: ${weaponObj?.name||"—"}`),
        h(Pill,null,`Style: ${styleObj?.name||"—"}`),
        elementObj?h(Pill,null,`Affinity: ${elementObj.name}`):null,
        h(Pill,null,`Depth: ${state.run.depth}`)
      ),
      h("div",{className:"rounded-2xl border border-white/10 p-4 bg-white/5"},
        h("div",{className:"text-lg font-semibold"},state.run.site?.name||"—"),
        h("div",{className:"text-sm text-white/70 mt-1"},state.run.site?.tone||"—"),
        state.run.inCombat && state.run.enemy ?
          h("div",{className:"mt-3 flex items-center justify-between"},
            h("div",null,h("div",{className:"font-semibold"},`⚔️ ${state.run.enemy.name}`),h("div",{className:"text-xs text-white/60"},`Enemy DR ${state.run.enemy.dr} • Attack DR ${state.run.enemy.attackDR}`)),
            h("div",{className:"text-lg font-semibold"},`HP ${state.run.enemyHP}/${state.run.enemy.hp}`)
          )
          : h("div",{className:"mt-3 text-sm text-white/60"},currentNode?.kind==="fight"?"A threat lurks here.":"This node is quiet… for now.")
      ),
      h("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3"},
        h("div",{className:"rounded-2xl border border-white/10 p-4"},
          h("div",{className:"font-semibold"},"Map"),
          h(Divider),
          h("div",{className:"rounded-2xl border border-white/10 bg-white/5 p-3"},
            h("svg",{viewBox:"0 0 100 100",className:"w-full h-44"},
              (state.run.nodeWeb?.edges||[]).map((e,i)=>{const a=state.run.nodeWeb.nodes.find(n=>n.id===e.a);const b=state.run.nodeWeb.nodes.find(n=>n.id===e.b);if(!a||!b) return null;return h("line",{key:i,x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:"rgba(255,255,255,0.16)",strokeWidth:1.5});}),
              (state.run.nodeWeb?.nodes||[]).map(n=>{const isHere=n.id===state.run.currentNodeId;const fill=n.kind==="fight"?"rgba(239,68,68,0.22)":n.kind==="station"?"rgba(34,197,94,0.18)":"rgba(59,130,246,0.16)";const stroke=isHere?"rgba(255,255,255,0.65)":n.revealed?"rgba(255,255,255,0.28)":"rgba(255,255,255,0.10)";const opacity=n.revealed?1:0.3;return h("g",{key:n.id,opacity},h("circle",{cx:n.x,cy:n.y,r:6.5,fill,stroke,strokeWidth:2}));})
            ),
            h("div",{className:"flex flex-wrap gap-2 mt-2"},(state.run.nodeWeb?.nodes||[]).filter(n=>n.revealed).map(n=>{
              const isHere=n.id===state.run.currentNodeId; const icon=n.kind==="fight"?"⚔":n.kind==="station"?"⬡":"✦";
              return h(Button,{key:n.id,variant:isHere?"primary":"ghost",onClick:()=>onMoveToNode(n.id),disabled:isHere||state.run.inCombat,title:n.site?.name},`${icon} ${n.site?.name||n.id}`);
            }))
          ),
          h(Divider),
          h("div",{className:"flex flex-wrap gap-2"},
            h(Button,{variant:"ghost",onClick:onRest,disabled:state.run.inCombat},"Rest"),
            h(Button,{variant:"ghost",onClick:onBuildStation,disabled:state.run.inCombat,title:"Requires Relay Parts"},"Build Drop Station"),
            h(Button,{variant:"ghost",onClick:onExtract,disabled:(!canExtractHere)||state.run.inCombat,title:canExtractHere?"Save carried items.":"No station here."},"Extract")
          )
        ),
        h("div",{className:"rounded-2xl border border-white/10 p-4"},
          h("div",{className:"font-semibold"},"Actions"),
          h(Divider),
          state.run.inCombat ? h("div",{className:"flex flex-wrap gap-2"},
            h(Button,{onClick:()=>onCombatAction("attack")},"Attack"),
            h(Button,{variant:"ghost",onClick:()=>onCombatAction("defend")},"Brace"),
            h(Button,{variant:"ghost",onClick:()=>onCombatAction("maneuver")},"Maneuver"),
            skills.filter(s=>s.kind==="action" && !["attack","defend","maneuver"].includes(s.key)).map(s=>h(Button,{key:s.key,variant:"ghost",onClick:()=>onCombatAction(s.key)},s.name))
          ) : h("div",{className:"text-sm text-white/70"},"Choose a node on the map to advance.")
        )
      )
    );
  };
})();