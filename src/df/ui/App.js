(() => {
  const {React}=DF; const {useEffect,useMemo,useRef,useState}=React; const h=React.createElement;
  DF.App=()=>{
    const [state,setState]=useState(()=>DF.mkNewGame());
    const [toast,setToast]=useState(null);
    const toastTimer=useRef(null);
    useEffect(()=>{DF.state=state;},[state]);

    const weaponObj=useMemo(()=>DF.WEAPONS.find(w=>w.key===state.player.weapon)||null,[state.player.weapon]);
    const styleObj=useMemo(()=>DF.WEAPONS.flatMap(w=>w.styles).find(s=>s.key===state.player.style)||null,[state.player.style]);
    const elementObj=useMemo(()=>DF.ELEMENTS.find(e=>e.key===state.player.element)||null,[state.player.element]);
    const skills=useMemo(()=>DF.skillListForBuild(state.player.weapon,state.player.style,state.player.element,state.player.crossStyle),[state.player.weapon,state.player.style,state.player.element,state.player.crossStyle]);

    const showToast=(msg)=>{setToast(msg); if(toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current=setTimeout(()=>setToast(null),2200);};

    const recalcPlayer=(d)=>{
      const w=DF.WEAPONS.find(x=>x.key===d.player.weapon);
      const bias=w?.bias||{might:0,finesse:0,wits:0,will:0};
      d.player.stats=DF.computeStats(d.player.baseStats,bias,d.player.style,d.player.element,d.player.crossStyle);
      const hpBase=10+(d.meta.legacy.startHP||0);
      d.player.hpMax=hpBase; d.player.hp=DF.clamp(d.player.hp,0,hpBase);
      d.player.title=DF.titleFromBuild(d.player.weapon,d.player.style,d.player.element,d.player.crossStyle);
    };

    const saveGame=()=>{try{DF.saveGame(state);showToast("Saved.");}catch{showToast("Save failed.");}};
    const loadGame=()=>{try{const parsed=DF.loadGame(); if(!parsed) return showToast("No save found."); setState(parsed); showToast("Loaded.");}catch{showToast("Load failed.");}};
    const clearSave=()=>{try{DF.clearSave();showToast("Save cleared.");}catch{showToast("Could not clear.");}};
    const hardReset=()=>{const next=DF.mkNewGame(Date.now()); next.meta=state.meta; next.player.hpMax=10+(next.meta.legacy.startHP||0); next.player.hp=next.player.hpMax; DF.pushLog(next,{type:"system",text:"New run started."}); setState(next); showToast("New run.");};

    useEffect(()=>{setState(prev=>{const d=structuredClone(prev); DF.pushLog(d,{type:"story",text:"Dragons rule the skies. Cities survive as beacons. The Mountain Expanse pays in blood and salvage."}); DF.pushLog(d,{type:"story",text:"Promotions require XP. Only extracted goods endure."}); return d;});},[]);

    const chooseWeapon=(weaponKey)=>setState(prev=>{const d=structuredClone(prev); d.player.weapon=weaponKey; recalcPlayer(d); d.phase="chooseStyle"; DF.pushLog(d,{type:"system",text:`Armament chosen: ${weaponKey.toUpperCase()}.`}); return d;});
    const chooseStyle=(styleKey)=>setState(prev=>{const d=structuredClone(prev); d.player.style=styleKey; recalcPlayer(d); d.phase="play"; d.run.depth=1; const rng=DF.mulberry32(d.rngSeed^0xabc); d.run.nodeWeb=DF.createNodeWeb(rng); d.run.currentNodeId="n0"; const start=d.run.nodeWeb.nodes.find(n=>n.id==="n0"); d.run.site=start?.site||DF.pickSite(rng); d.run.danger="unknown"; DF.pushLog(d,{type:"system",text:`Style chosen: ${styleKey.toUpperCase()}.`}); DF.pushLog(d,{type:"story",text:"You are torn into light. Then—cold stone, thin air, and the smell of ash."}); return d;});

    const takeDamage=(d,amount,reason)=>{d.player.hp=DF.clamp(d.player.hp-amount,0,d.player.hpMax); DF.pushLog(d,{type:"system",text:`You take ${amount} damage (${reason}).`}); if(d.player.hp<=0){d.phase="dead"; const echoes=2+d.run.depth+Math.floor(d.player.gold/3); d.meta.echoes+=echoes; DF.pushLog(d,{type:"story",text:"☠️ You fall. The mountain keeps what you failed to extract."}); DF.pushLog(d,{type:"system",text:`You gain ${echoes} Echoes at the Beacon.`});}};
    const ensureEncounter=()=>setState(prev=>{const d=structuredClone(prev); if(d.run.inCombat) return prev; const rng=DF.mulberry32(d.rngSeed^d.run.depth^0xdead); const enemy=DF.pickEnemy(rng); d.run.inCombat=true; d.run.enemy={...enemy}; d.run.enemyHP=enemy.hp; DF.pushLog(d,{type:"story",text:`⚔️ ${enemy.name} appears. ${enemy.desc}`}); return d;});
    const enemyTurn=(d,ctx)=>DF.resolveEnemyTurn(d,takeDamage,ctx);

    const endCombatWin=(d)=>{const rng=DF.mulberry32(d.rngSeed^d.run.depth^0xbeef); const loot=d.run.site?.loot?d.run.site.loot[Math.floor(rng()*d.run.site.loot.length)]:"Scrap"; d.player.inventory.push(loot); d.player.gold+=1+Math.floor(rng()*3); const xp=2; d.player.xp+=xp; d.run.inCombat=false; d.run.enemy=null; d.run.enemyHP=0; d.run.danger="cleared"; const node=d.run.nodeWeb?.nodes.find(n=>n.id===d.run.currentNodeId); if(node) node.cleared=true; DF.pushLog(d,{type:"system",text:`Victory. Loot gained: ${loot}. +${xp} XP.`}); if(d.player.promoTier===0 && d.player.xp>=d.player.nextPromoAt){d.ui.showPromotion=true; DF.pushLog(d,{type:"story",text:"Something in you shifts. A new discipline is ready to bind."});}};

    const choosePromotionElement=(k)=>setState(prev=>{const d=structuredClone(prev); d.player.element=k; d.player.crossStyle=null; d.player.promoTier=1; d.ui.showPromotion=false; recalcPlayer(d); DF.pushLog(d,{type:"system",text:`Promotion: Affinity ${k.toUpperCase()}.`}); return d;});
    const choosePromotionCross=(k)=>setState(prev=>{const d=structuredClone(prev); d.player.crossStyle=k; d.player.element=null; d.player.promoTier=1; d.ui.showPromotion=false; recalcPlayer(d); DF.pushLog(d,{type:"system",text:`Promotion: Cross-Training ${k.toUpperCase()}.`}); return d;});

    const moveToNode=(id)=>setState(prev=>{const d=structuredClone(prev); const web=d.run.nodeWeb; if(!web) return prev; const cur=d.run.currentNodeId; if(cur===id) return prev; const adjacent=web.edges.some(e=>(e.a===cur&&e.b===id)||(e.b===cur&&e.a===id)); if(!adjacent){DF.pushLog(d,{type:"system",text:"You cannot reach that node from here."}); return d;} d.run.currentNodeId=id; const node=web.nodes.find(n=>n.id===id); if(node){d.run.site=node.site; d.run.depth+=1; for(const e of web.edges){ if(e.a===id){const nb=web.nodes.find(x=>x.id===e.b); if(nb) nb.revealed=true;} if(e.b===id){const nb=web.nodes.find(x=>x.id===e.a); if(nb) nb.revealed=true;} } d.run.danger=node.kind==="fight"?"unknown":"cleared"; DF.pushLog(d,{type:"story",text:`You move to: ${node.site.name}.`}); DF.pushLog(d,{type:"story",text:node.site.tone}); if(node.kind==="station") DF.pushLog(d,{type:"system",text:"A dormant relay sits here. You may Extract."}); } return d;});

    const rest=()=>setState(prev=>{const d=structuredClone(prev); const rng=DF.mulberry32(d.rngSeed^d.run.depth^0x3333^Date.now()); const heal=2; d.player.hp=DF.clamp(d.player.hp+heal,0,d.player.hpMax); DF.pushLog(d,{type:"system",text:`You rest (+${heal} HP).`}); if(rng()<0.5) ensureEncounter(); else DF.pushLog(d,{type:"story",text:"The wind passes. No footsteps."}); return d;});
    const buildStation=()=>setState(prev=>{const d=structuredClone(prev); const idx=d.player.inventory.indexOf("Relay Parts"); if(idx===-1){DF.pushLog(d,{type:"system",text:"You lack Relay Parts to build a Drop Station."}); return d;} d.player.inventory.splice(idx,1); d.player.stationBuilt+=1; DF.pushLog(d,{type:"story",text:"You assemble a crude Drop Station. A faint ward flickers to life."}); DF.pushLog(d,{type:"system",text:"You can now Extract here."}); return d;});
    const extract=()=>setState(prev=>{const d=structuredClone(prev); const items=d.player.inventory.splice(0); d.player.extracted.push(...items); DF.pushLog(d,{type:"system",text:`Extraction complete. Saved ${items.length} item(s).`}); return d;});

    const combatAction=(key)=>setState(prev=>{const d=structuredClone(prev); if(d.phase!=="play"||!d.run.inCombat||!d.run.enemy) return prev; const enemy=d.run.enemy; const rng=DF.mulberry32(d.rngSeed^d.run.depth^0x2222^Date.now()); const atk=DF.computeAttackMod(d.player.stats,d.player.weapon); const def=DF.computeDefenseMod(d.player.stats,d.player.style);
      const doAttack=(label,bonus,min,max,onMiss)=>{const check=DF.rollCheck(rng,label,atk+bonus,enemy.dr); DF.pushLog(d,{type:"roll",text:`${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${check.success?"SUCCESS":"FAIL"}`});
        if(check.success){let dmg=DF.rollDamage(rng,min,max); if(check.d20===20){dmg+=1; if(d.player.element==="fire") dmg+=1; DF.pushLog(d,{type:"system",text:"Critical impact."});} d.run.enemyHP=Math.max(0,d.run.enemyHP-dmg); DF.pushLog(d,{type:"system",text:`Enemy takes ${dmg} damage.`}); if(d.run.enemyHP<=0){endCombatWin(d); return;}} else {if(onMiss) onMiss();}
        if(d.phase!=="dead") enemyTurn(d,"combat");
      };
      if(key==="attack"){doAttack("You attack",0,1,3); return d;}
      if(key==="defend"){d.run._defendActive=true; DF.pushLog(d,{type:"system",text:`You Brace (Defense mod ${DF.fmtBonus(def)}).`}); enemyTurn(d,"brace"); return d;}
      if(key==="maneuver"){const check=DF.rollCheck(rng,"You Maneuver",d.player.stats.wits+d.player.stats.finesse,DF.DR.standard); DF.pushLog(d,{type:"roll",text:`${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${check.success?"SUCCESS":"FAIL"}`}); if(!check.success) takeDamage(d,1,"misstep"); if(d.phase!=="dead") enemyTurn(d,"counter"); return d;}
      if(key==="aim"){DF.pushLog(d,{type:"system",text:"You Aim (+2 baked into this shot)."}); doAttack("Aimed Shot",2,1,4); return d;}
      if(key==="dash"){const check=DF.rollCheck(rng,"Dash Shot",atk+1,enemy.dr); DF.pushLog(d,{type:"roll",text:`${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${check.success?"SUCCESS":"FAIL"}`}); if(check.success){const dmg=DF.rollDamage(rng,1,3); d.run.enemyHP=Math.max(0,d.run.enemyHP-dmg); DF.pushLog(d,{type:"system",text:`Enemy takes ${dmg} damage.`}); if(d.run.enemyHP<=0){endCombatWin(d); return d;} DF.pushLog(d,{type:"system",text:"You slip out of reach. No retaliation."}); return d;} enemyTurn(d,"dash-fail"); return d;}
      if(key==="snare"){DF.pushLog(d,{type:"system",text:"You set a Snare. Enemy Attack DR +2 once."}); const old=enemy.attackDR; enemy.attackDR=old+2; enemyTurn(d,"snare"); enemy.attackDR=old; return d;}
      if(key==="bolt"){doAttack("Arc Bolt",1,1,5); return d;}
      if(key==="hex"){const old=enemy.dr; enemy.dr=Math.max(8,enemy.dr-2); DF.pushLog(d,{type:"system",text:"Hex: Enemy DR −2 this turn."}); doAttack("Hexed Strike",0,1,2); enemy.dr=old; return d;}
      if(key==="focus"){DF.pushLog(d,{type:"system",text:"You Focus (+2 baked into next cast)."}); doAttack("Focused Cast",2,1,4); return d;}
      if(key==="riposte"){doAttack("Shield-Check",0,1,2); return d;}
      if(key==="bleed"){doAttack("Open Vein",0,2,4,()=>takeDamage(d,1,"overextension")); return d;}
      if(key==="lunge"){doAttack("Lunge",1,2,5,()=>takeDamage(d,2,"exposed")); return d;}
      return d;
    });

    const reviveToStart=()=>setState(prev=>{const d=structuredClone(prev); if(d.phase!=="dead") return d; const next=DF.mkNewGame(Date.now()); next.meta=d.meta; next.player.hpMax=10+(next.meta.legacy.startHP||0); next.player.hp=next.player.hpMax; DF.pushLog(next,{type:"system",text:"You wake at the Beacon. The mountain waits."}); return next;});
    const metaSpend=(key,cost,apply)=>setState(prev=>{const d=structuredClone(prev); if(d.meta.echoes<cost){DF.pushLog(d,{type:"system",text:"Not enough Echoes."}); return d;} d.meta.echoes-=cost; apply(d); DF.pushLog(d,{type:"system",text:`Beacon upgraded: ${key}.`}); return d;});

    const currentNode=state.run.nodeWeb?.nodes.find(n=>n.id===state.run.currentNodeId);
    const canExtractHere=(state.player.stationBuilt>0)||(state.run.site?.key==="ruined_relay")||(currentNode?.kind==="station");

    useEffect(()=>{ if(state.phase!=="play") return; if(state.run.inCombat) return; if(state.run.danger==="unknown"&&currentNode?.kind==="fight") ensureEncounter(); },[state.phase,state.run.inCombat,state.run.danger,state.run.currentNodeId]);

    const subtitle=state.phase==="dead"?"☠️ Fallen":state.phase==="play"?"In the Mountain":"Preparation";
    const {Card,Pill,Button}=DF;

    const hudPills=[h(Pill,{key:"hp"},`HP ${state.player.hp}/${state.player.hpMax}`),h(Pill,{key:"xp"},`XP ${state.player.xp}`),h(Pill,{key:"echoes"},`Echoes ${state.meta.echoes}`),h(Pill,{key:"gold"},`Gold ${state.player.gold}`)];
    const topActions=[h(Button,{key:"save",onClick:saveGame,variant:"ghost"},"Save"),h(Button,{key:"load",onClick:loadGame,variant:"ghost"},"Load"),h(Button,{key:"clear",onClick:clearSave,variant:"ghost"},"Clear"),h(Button,{key:"new",onClick:hardReset,variant:"danger"},"New Run")];

    const chatLog=state.run.log||[];
    const chatPanel=h("div",{className:"df-chat-shell"},
      h("div",{className:"df-chat-shell__tabs"},["Log","Combat","System"].map(t=>h("button",{key:t,className:"df-chat-shell__tab",disabled:t!=="Log"},t))),
      h("div",{className:"df-chat-shell__body"},chatLog.length?chatLog.slice(-30).reverse().map(l=>h("div",{key:l.id||Math.random(),className:"df-chat-shell__line"},h("span",{className:"df-chat-shell__bullet"},"•"),h("span",null,l.text||l.toString()))):h("div",{className:"df-chat-shell__empty"},"No events yet.")),
      h("div",{className:"df-chat-shell__input"},h("input",{type:"text",disabled:true,placeholder:"Chat coming soon",className:"df-chat-shell__input-box"}))
    );

    const viewportSplash=(title,body)=>h("div",{className:"df-viewport-card"},
      h("div",{className:"df-viewport-card__inner"},
        h("div",{className:"df-viewport-card__heading"},title),
        h("div",{className:"df-viewport-card__body"},body)
      )
    );

    const viewportPlay=h("div",{className:"df-viewport-card"},
      h("div",{className:"df-viewport-card__frame"},
        h("div",{className:"df-viewport-card__title"},"Field View"),
        h("div",{className:"df-viewport-card__canvas"},h(DF.WorldViewport,{scale:4})),
        h("div",{className:"df-viewport-card__hint"},
          h("div",{className:"df-viewport-card__hint-main"},(state.run.log?.find(l=>l.type==="story")||state.run.log?.[state.run.log.length-1]||{}).text||"The mountain waits."),
          h("div",{className:"df-viewport-card__hint-sub"},"Pixel viewport scales to fit")
        )
      )
    );

    const playActions=h(Card,{title:"Actions",subtitle:"Quick commands"},
      h("div",{className:"df-action-grid"},
        h(Button,{variant:"ghost",onClick:()=>setState(prev=>({...prev,ui:{...prev.ui,showClassTree:!prev.ui.showClassTree}}))},"Class Lattice"),
        h(Button,{variant:"ghost",onClick:rest},"Rest"),
        h(Button,{variant:"ghost",onClick:buildStation},"Build Station"),
        h(Button,{variant:"ghost",onClick:extract},"Extract")
      ),
      h("div",{className:"df-panel__note"},"Movement + combat hooks stay intact; UI is now shell-based.")
    );

    const slotGrid=Array.from({length:20});
    const inventoryPanel=h(Card,{title:"Inventory",subtitle:"Equipment preview"},
      h("div",{className:"df-slot-grid"},
        slotGrid.map((_,idx)=>h("div",{key:idx,className:"df-slot"},(state.player.inventory||[])[idx]?h("span",{className:"df-slot__item"},(state.player.inventory||[])[idx]):null))
      ),
      h("div",{className:"df-panel__note"},"Extracted goods persist across runs. Slots are a preview.")
    );

    const prepSidebar=[
      h(Card,{key:"prep",title:"Loadout",subtitle:"Choose how you start"},h(DF.PrepScreen,{state,weaponObj,onChooseWeapon:chooseWeapon,onChooseStyle:chooseStyle,onToggleClassTree:()=>setState(p=>({...p,ui:{...p.ui,showClassTree:!p.ui.showClassTree}}))})),
      inventoryPanel,
      h(DF.HelpPanel,{key:"help"})
    ];

    const playSidebar=[
      playActions,
      h(DF.CharacterPanel,{state,skills,key:"stats"}),
      inventoryPanel,
      h(DF.HelpPanel,{key:"help"})
    ];

    const deadSidebar=[
      h(Card,{key:"return",title:"Beacon",subtitle:"Spend echoes"},h(DF.DeadScreen,{state,onMetaSpend:metaSpend,onWake:reviveToStart})),
      inventoryPanel,
      h(DF.HelpPanel,{key:"help"})
    ];

    const viewportContent=state.phase==="play"?viewportPlay:state.phase==="dead"?viewportSplash("Beacon Silence","You fell in the mountain. Return stronger."):viewportSplash("Arcane Run","Dragons own the sky. Promotions require XP. Only extracted goods endure.");
    const sidebarContent=state.phase==="play"?playSidebar:state.phase==="dead"?deadSidebar:prepSidebar;

    return h("div",{className:"df-app"},
      h(DF.GameShell,{
        title:"Dragonfall",
        subtitle:subtitle,
        versionLabel:`Arcane Run • v${DF.VERSION}`,
        hudPills,
        topActions,
        keyboardHints:["[Esc] Menu","[H] Help"],
        viewport:viewportContent,
        sidebar:sidebarContent,
        bottom:chatPanel
      }),
      h(DF.PromotionModal,{state,onLater:()=>setState(p=>({...p,ui:{...p.ui,showPromotion:false}})),onChooseElement:choosePromotionElement,onChooseCross:choosePromotionCross}),
      h(DF.Toast,{toast})
    );
  };
})();
