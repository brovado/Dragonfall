(() => {
  const {React}=DF; const {useEffect,useMemo,useRef,useState}=React; const h=React.createElement;
  DF.App=()=>{
    const screenForPhase=(phase)=>{
      if(phase==="dead") return "DeadScreen";
      if(phase==="play") return "PlayScreen";
      return "PrepScreen";
    };
    const withScreen=(draft)=>{
      if(!draft.screen) draft.screen=screenForPhase(draft.phase);
      if(!draft.run) draft.run={status:"exploring"};
      if(!draft.run.status) draft.run.status="exploring";
      if(!draft.ui) draft.ui={};
      if(typeof draft.ui.travelOpen!=="boolean") draft.ui.travelOpen=false;
      return draft;
    };

    const [state,setState]=useState(()=>withScreen(DF.mkNewGame()));
    const [toast,setToast]=useState(null);
    const toastTimer=useRef(null);
    useEffect(()=>{DF.state=state;},[state]);

    const weaponObj=useMemo(()=>DF.WEAPONS.find(w=>w.key===state.player.weapon)||null,[state.player.weapon]);
    const styleObj=useMemo(()=>DF.WEAPONS.flatMap(w=>w.styles).find(s=>s.key===state.player.style)||null,[state.player.style]);
    const elementObj=useMemo(()=>DF.ELEMENTS.find(e=>e.key===state.player.element)||null,[state.player.element]);
    const skills=useMemo(()=>DF.skillListForBuild(state.player.weapon,state.player.style,state.player.element,state.player.crossStyle),[state.player.weapon,state.player.style,state.player.element,state.player.crossStyle]);
    const travelOptions=useMemo(()=>reachableNodes(state.run.nodeWeb,state.run.currentNodeId),[state.run.nodeWeb,state.run.currentNodeId]);

    const showToast=(msg)=>{setToast(msg); if(toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current=setTimeout(()=>setToast(null),2200);};

    const recalcPlayer=(d)=>{
      const w=DF.WEAPONS.find(x=>x.key===d.player.weapon);
      const bias=w?.bias||{might:0,finesse:0,wits:0,will:0};
      d.player.stats=DF.computeStats(d.player.baseStats,bias,d.player.style,d.player.element,d.player.crossStyle);
      const hpBase=10+(d.meta.legacy.startHP||0);
      d.player.hpMax=hpBase; d.player.hp=DF.clamp(d.player.hp,0,hpBase);
      d.player.title=DF.titleFromBuild(d.player.weapon,d.player.style,d.player.element,d.player.crossStyle);
    };
    const reachableNodes=(web,currentId)=>{
      if(!web||!currentId) return [];
      const out=new Set();
      for(const e of web.edges||[]){
        if(e.a===currentId) out.add(e.b);
        if(e.b===currentId) out.add(e.a);
      }
      return Array.from(out);
    };
    const setStatus=(draft,status)=>{ if(!draft.run) return; draft.run.status=status; };

    const saveGame=()=>{try{DF.saveGame(state);showToast("Saved.");}catch{showToast("Save failed.");}};
    const loadGame=()=>{try{const parsed=DF.loadGame(); if(!parsed) return showToast("No save found."); const next=withScreen(structuredClone(parsed)); setState(next); showToast("Loaded.");}catch{showToast("Load failed.");}};
    const clearSave=()=>{try{DF.clearSave();showToast("Save cleared.");}catch{showToast("Could not clear.");}};
    const hardReset=()=>{const next=withScreen(DF.mkNewGame(Date.now())); next.meta=state.meta; next.player.hpMax=10+(next.meta.legacy.startHP||0); next.player.hp=next.player.hpMax; setStatus(next,"exploring"); DF.pushLog(next,{type:"system",text:"New run started."}); setState(next); showToast("New run.");};

    useEffect(()=>{setState(prev=>{const d=structuredClone(prev); DF.pushLog(d,{type:"story",text:"Dragons rule the skies. Cities survive as beacons. The Mountain Expanse pays in blood and salvage."}); DF.pushLog(d,{type:"story",text:"Promotions require XP. Only extracted goods endure."}); return d;});},[]);

    const chooseWeapon=(weaponKey)=>setState(prev=>{const d=withScreen(structuredClone(prev)); d.player.weapon=weaponKey; recalcPlayer(d); d.phase="chooseStyle"; d.screen=screenForPhase(d.phase); DF.pushLog(d,{type:"system",text:`Armament chosen: ${weaponKey.toUpperCase()}.`}); return d;});
    const chooseStyle=(styleKey)=>setState(prev=>{const d=withScreen(structuredClone(prev)); d.player.style=styleKey; recalcPlayer(d); d.phase="play"; d.screen=screenForPhase(d.phase); d.run.depth=1; const rng=DF.mulberry32(d.rngSeed^0xabc); d.run.nodeWeb=DF.createNodeWeb(rng); d.run.currentNodeId="n0"; const start=d.run.nodeWeb.nodes.find(n=>n.id==="n0"); d.run.site=start?.site||DF.pickSite(rng); d.run.danger="unknown"; setStatus(d,"exploring"); d.ui.showClassTree=false; DF.pushLog(d,{type:"system",text:`Style chosen: ${styleKey.toUpperCase()}.`}); DF.pushLog(d,{type:"story",text:"You are torn into light. Then—cold stone, thin air, and the smell of ash."}); return d;});

    const takeDamage=(d,amount,reason)=>{d.player.hp=DF.clamp(d.player.hp-amount,0,d.player.hpMax); DF.pushLog(d,{type:"system",text:`You take ${amount} damage (${reason}).`}); if(d.player.hp<=0){d.phase="dead"; d.screen=screenForPhase(d.phase); const echoes=2+d.run.depth+Math.floor(d.player.gold/3); d.meta.echoes+=echoes; DF.pushLog(d,{type:"story",text:"☠️ You fall. The mountain keeps what you failed to extract."}); DF.pushLog(d,{type:"system",text:`You gain ${echoes} Echoes at the Beacon.`});}};
    const ensureEncounter=(draft)=>{
      const spawn=(d)=>{
        if(d.run.inCombat) return d;
        const rng=DF.mulberry32(d.rngSeed^d.run.depth^0xdead);
        const enemy=DF.pickEnemy(rng);
        d.run.inCombat=true; d.ui.travelOpen=false; setStatus(d,"in_combat");
        d.run.enemy={...enemy}; d.run.enemyHP=enemy.hp;
        DF.pushLog(d,{type:"story",text:`⚔️ ${enemy.name} appears. ${enemy.desc}`});
        return d;
      };
      if(draft) return spawn(draft);
      setState(prev=>{const d=structuredClone(prev); if(d.phase!=="play") return prev; return spawn(d);});
    };
    const enemyTurn=(d,ctx)=>DF.resolveEnemyTurn(d,takeDamage,ctx);

    const endCombatWin=(d)=>{const rng=DF.mulberry32(d.rngSeed^d.run.depth^0xbeef); const loot=d.run.site?.loot?d.run.site.loot[Math.floor(rng()*d.run.site.loot.length)]:"Scrap"; d.player.inventory.push(loot); d.player.gold+=1+Math.floor(rng()*3); const xp=2; d.player.xp+=xp; d.run.inCombat=false; d.run.enemy=null; d.run.enemyHP=0; d.run.danger="cleared"; setStatus(d,"exploring"); const node=d.run.nodeWeb?.nodes.find(n=>n.id===d.run.currentNodeId); if(node) node.cleared=true; DF.pushLog(d,{type:"system",text:`Victory. Loot gained: ${loot}. +${xp} XP.`}); if(d.player.promoTier===0 && d.player.xp>=d.player.nextPromoAt){d.ui.showPromotion=true; DF.pushLog(d,{type:"story",text:"Something in you shifts. A new discipline is ready to bind."});}};

    const choosePromotionElement=(k)=>setState(prev=>{const d=structuredClone(prev); d.player.element=k; d.player.crossStyle=null; d.player.promoTier=1; d.ui.showPromotion=false; recalcPlayer(d); DF.pushLog(d,{type:"system",text:`Promotion: Affinity ${k.toUpperCase()}.`}); return d;});
    const choosePromotionCross=(k)=>setState(prev=>{const d=structuredClone(prev); d.player.crossStyle=k; d.player.element=null; d.player.promoTier=1; d.ui.showPromotion=false; recalcPlayer(d); DF.pushLog(d,{type:"system",text:`Promotion: Cross-Training ${k.toUpperCase()}.`}); return d;});

    const moveToNode=(id)=>setState(prev=>{const d=structuredClone(prev); if(d.run.inCombat){DF.pushLog(d,{type:"system",text:"You cannot travel during combat."}); return d;} const web=d.run.nodeWeb; if(!web) return prev; const cur=d.run.currentNodeId; if(cur===id){d.ui.travelOpen=false; setStatus(d,"exploring"); return d;} const adjacent=web.edges.some(e=>(e.a===cur&&e.b===id)||(e.b===cur&&e.a===id)); if(!adjacent){DF.pushLog(d,{type:"system",text:"You cannot reach that node from here."}); return d;} d.run.currentNodeId=id; d.ui.selectedNode=id; d.ui.travelOpen=false; const node=web.nodes.find(n=>n.id===id); if(node){d.run.site=node.site; d.run.depth+=1; for(const e of web.edges){ if(e.a===id){const nb=web.nodes.find(x=>x.id===e.b); if(nb) nb.revealed=true;} if(e.b===id){const nb=web.nodes.find(x=>x.id===e.a); if(nb) nb.revealed=true;} } d.run.danger=node.kind==="fight"?"unknown":"cleared"; setStatus(d,"exploring"); DF.pushLog(d,{type:"story",text:`You move to: ${node.site.name}.`}); DF.pushLog(d,{type:"story",text:node.site.tone}); if(node.kind==="station") DF.pushLog(d,{type:"system",text:"A dormant relay sits here. You may Extract."}); } return d;});

    const rest=()=>setState(prev=>{const d=structuredClone(prev); if(d.phase!=="play"||d.run.inCombat){DF.pushLog(d,{type:"system",text:"You cannot rest right now."}); return d;} setStatus(d,"resting"); const rng=DF.mulberry32(d.rngSeed^d.run.depth^0x3333^Date.now()); const heal=2; d.player.hp=DF.clamp(d.player.hp+heal,0,d.player.hpMax); DF.pushLog(d,{type:"system",text:`You rest (+${heal} HP).`}); if(rng()<0.5){ensureEncounter(d); return d;} DF.pushLog(d,{type:"story",text:"The wind passes. No footsteps."}); setStatus(d,"exploring"); return d;});
    const toggleTravelOverlay=()=>setState(prev=>{const d=structuredClone(prev); if(d.phase!=="play") return d; if(d.run.inCombat){DF.pushLog(d,{type:"system",text:"Resolve combat before traveling."}); return d;} d.ui.travelOpen=!d.ui.travelOpen; setStatus(d,d.ui.travelOpen?"traveling":"exploring"); return d;});
    const closeTravelOverlay=()=>setState(prev=>{const d=structuredClone(prev); d.ui.travelOpen=false; if(!d.run.inCombat) setStatus(d,"exploring"); return d;});
    const buildStation=()=>setState(prev=>{const d=structuredClone(prev); const idx=d.player.inventory.indexOf("Relay Parts"); if(idx===-1){DF.pushLog(d,{type:"system",text:"You lack Relay Parts to build a Drop Station."}); return d;} d.player.inventory.splice(idx,1); d.player.stationBuilt+=1; DF.pushLog(d,{type:"story",text:"You assemble a crude Drop Station. A faint ward flickers to life."}); DF.pushLog(d,{type:"system",text:"You can now Extract here."}); return d;});
    const extract=()=>setState(prev=>{const d=structuredClone(prev); const items=d.player.inventory.splice(0); d.player.extracted.push(...items); DF.pushLog(d,{type:"system",text:`Extraction complete. Saved ${items.length} item(s).`}); return d;});

    const combatAction=(key)=>setState(prev=>{const d=structuredClone(prev); if(d.phase!=="play"||!d.run.inCombat||!d.run.enemy) return prev; setStatus(d,"in_combat"); const enemy=d.run.enemy; const rng=DF.mulberry32(d.rngSeed^d.run.depth^0x2222^Date.now()); const atk=DF.computeAttackMod(d.player.stats,d.player.weapon); const def=DF.computeDefenseMod(d.player.stats,d.player.style);
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

    const reviveToStart=()=>setState(prev=>{const d=structuredClone(prev); if(d.phase!=="dead") return d; const next=withScreen(DF.mkNewGame(Date.now())); next.meta=d.meta; next.player.hpMax=10+(next.meta.legacy.startHP||0); next.player.hp=next.player.hpMax; setStatus(next,"exploring"); DF.pushLog(next,{type:"system",text:"You wake at the Beacon. The mountain waits."}); return next;});
    const metaSpend=(key,cost,apply)=>setState(prev=>{const d=structuredClone(prev); if(d.meta.echoes<cost){DF.pushLog(d,{type:"system",text:"Not enough Echoes."}); return d;} d.meta.echoes-=cost; apply(d); DF.pushLog(d,{type:"system",text:`Beacon upgraded: ${key}.`}); return d;});

    const currentNode=state.run.nodeWeb?.nodes.find(n=>n.id===state.run.currentNodeId);
    const canExtractHere=(state.player.stationBuilt>0)||(state.run.site?.key==="ruined_relay")||(currentNode?.kind==="station");

    useEffect(()=>{ if(state.phase!=="play") return; if(state.run.inCombat) return; if(state.run.danger==="unknown"&&currentNode?.kind==="fight") ensureEncounter(); },[state.phase,state.run.inCombat,state.run.danger,state.run.currentNodeId]);

    const subtitle=state.phase==="dead"?"☠️ Fallen":state.phase==="play"?"In the Mountain":"Preparation";
    const modeLabel=(()=>{
      if(state.phase!=="play") return subtitle;
      if(state.run.inCombat) return "In Combat";
      if(state.ui.travelOpen||state.run.status==="traveling") return "Traveling";
      if(state.run.status==="resting") return "Resting";
      return "Exploring";
    })();
    const {Card,Pill,Button}=DF;

    const toggleLoadoutOverlay=()=>setState(prev=>({...prev,ui:{...prev.ui,showClassTree:!prev.ui.showClassTree}}));

    const hudPills=[h(Pill,{key:"hp"},`HP ${state.player.hp}/${state.player.hpMax}`),h(Pill,{key:"xp"},`XP ${state.player.xp}`),h(Pill,{key:"echoes"},`Echoes ${state.meta.echoes}`),h(Pill,{key:"gold"},`Gold ${state.player.gold}`)];
    const topActions=[h(Button,{key:"save",onClick:saveGame,variant:"ghost"},"Save"),h(Button,{key:"load",onClick:loadGame,variant:"ghost"},"Load"),h(Button,{key:"clear",onClick:clearSave,variant:"ghost"},"Clear"),h(Button,{key:"new",onClick:hardReset,variant:"danger"},"New Run")];

    const chatLog=state.run.log||[];
    const chatPanel=h("div",{className:"df-chat-shell"},
      h("div",{className:"df-chat-shell__tabs"},["Log","Combat","System"].map(t=>h("button",{key:t,className:"df-chat-shell__tab",disabled:t!=="Log"},t))),
      h("div",{className:"df-chat-shell__body"},chatLog.length?chatLog.slice(-30).reverse().map(l=>h("div",{key:l.id||Math.random(),className:"df-chat-shell__line"},h("span",{className:"df-chat-shell__bullet"},"•"),h("span",null,l.text||l.toString()))):h("div",{className:"df-chat-shell__empty"},"No events yet.")),
      h("div",{className:"df-chat-shell__input"},h("input",{type:"text",disabled:true,placeholder:"Chat coming soon",className:"df-chat-shell__input-box"}))
    );

    const latestStory=(state.run.log?.find(l=>l.type==="story")||state.run.log?.[state.run.log.length-1]||{})?.text||"The mountain waits.";
    const worldCard=h("div",{className:"df-viewport-card df-playwindow__world"},
      h("div",{className:"df-viewport-card__frame"},
        h("div",{className:"df-viewport-card__title"}, state.phase==="dead"?"Beacon View":"Field View"),
        h("div",{className:"df-viewport-card__canvas"},
          h(DF.WorldViewport,{
            scale:4,
            nodeWeb:state.run.nodeWeb,
            currentNodeId:state.run.currentNodeId,
            availableTargets:travelOptions,
            selectedNodeId:state.ui.selectedNode,
            onSelectNode:(id)=>moveToNode(id)
          })
        ),
        h("div",{className:"df-viewport-card__hint"},
          h("div",{className:"df-viewport-card__hint-main"},latestStory),
          h("div",{className:"df-viewport-card__hint-sub"},state.run.site?.name||"Pixel viewport scales to fit")
        )
      )
    );

    const infoCard=h("div",{className:"df-playwindow__intel"},
      h("div",{className:"df-panel__section-title"},"Site Intel"),
      h("div",{className:"df-info-grid"},
        h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Phase"),h("div",{className:"df-info-value"},state.phase.toUpperCase())),
        h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"State"),h("div",{className:"df-info-value"},modeLabel)),
        h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Danger"),h("div",{className:"df-info-value"},state.run.danger||"calm")),
        h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Depth"),h("div",{className:"df-info-value"},state.run.depth||0)),
        h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Region"),h("div",{className:"df-info-value"},state.run.region||"Unknown"))
      ),
      h("div",{className:"df-panel__section-title"},"Vitals"),
      h("div",{className:"df-chip-row"},
        h(Pill,null,`HP ${state.player.hp}/${state.player.hpMax}`),
        h(Pill,null,`XP ${state.player.xp}`),
        h(Pill,null,`Gold ${state.player.gold}`)
      ),
      h("div",{className:"df-panel__note"},"Primary interactions now live inside the play window. Use toggles to open overlays.")
    );

    const viewportContent=h(React.Fragment,null,worldCard,infoCard);

    const loadoutOverlay=h("div",{className:"df-loadout-overlay"},
      h("div",{className:"df-panel__section-title"},"Class & Loadout"),
      h("div",{className:"df-info-grid"},
        h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Weapon"),h("div",{className:"df-info-value"},weaponObj?.name||"Unbound")),
        h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Style"),h("div",{className:"df-info-value"},styleObj?.name||"Untrained")),
        h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Element"),h("div",{className:"df-info-value"},elementObj?.name||"None")),
        h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Title"),h("div",{className:"df-info-value"},state.player.title||"Unbound"))
      ),
      h("div",{className:"df-panel__section-title"},"Skills"),
      h("div",{className:"df-skill-list"},skills.map(s=>h("div",{key:s.key,className:"df-skill-card"},h("div",{className:"df-skill-card__top"},h("div",{className:"df-skill-card__title"},s.name),h("span",{className:"df-skill-card__kind"},s.kind)),h("div",{className:"df-skill-card__desc"},s.desc)))),
      h("div",{className:"df-panel__note"},"Loadout overlay lives inside the play window for class changes and confirmations.")
    );
    const travelOverlay=state.ui.travelOpen?h(DF.TravelOverlay,{
      currentNode,
      options:(state.run.nodeWeb?.nodes||[]).filter(n=>travelOptions.includes(n.id)),
      allNodes:state.run.nodeWeb?.nodes||[],
      onClose:closeTravelOverlay,
      onTravel:moveToNode
    }):null;

    const screenKey=state.screen||screenForPhase(state.phase);
    const defaultScreens={PrepScreen:DF.PrepScreen,PlayScreen:DF.PlayScreen,DeadScreen:DF.DeadScreen};
    const screens={...defaultScreens,...(DF.ui?.screens||{})};
    const ScreenComponent=screens[screenKey];
    const screenProps=({
      PrepScreen:{state,weaponObj,onChooseWeapon:chooseWeapon,onChooseStyle:chooseStyle,onToggleClassTree:toggleLoadoutOverlay},
      PlayScreen:{state},
      DeadScreen:{state,onMetaSpend:metaSpend,onWake:reviveToStart}
    })[screenKey]||{state};
    const isDefaultScreen=ScreenComponent===defaultScreens[screenKey];
    const shouldRenderScreen=!!ScreenComponent && (screenKey!=="PlayScreen" || !isDefaultScreen);
    let overlayContent=null;
    if(state.ui.travelOpen) overlayContent=travelOverlay;
    else if(shouldRenderScreen) overlayContent=h(ScreenComponent,{key:screenKey,...screenProps});
    else if(state.ui.showClassTree) overlayContent=loadoutOverlay;

    const canTravel=state.phase==="play"&&!state.run.inCombat;
    const actionButtons=(()=>{
      if(state.phase==="dead") return [
        {key:"wake",label:"Wake at Beacon",hint:"1",onClick:reviveToStart}
      ];
      if(state.phase!=="play") return [
        {key:"loadout",label:"Loadout Overlay",hint:"1",onClick:toggleLoadoutOverlay}
      ];
      const contextAction=state.run.inCombat
        ? {key:"brace",label:"Brace",hint:"5",onClick:()=>combatAction("defend")}
        : canExtractHere
          ? {key:"extract",label:"Extract",hint:"5",onClick:extract}
          : {key:"build",label:"Build Station",hint:"5",onClick:buildStation};
      return [
        {key:"attack",label:"Attack",hint:"1",onClick:()=>combatAction("attack"),disabled:!state.run.inCombat},
        {key:"rest",label:"Rest",hint:"2",onClick:rest,disabled:state.run.inCombat},
        {key:"travel",label:state.ui.travelOpen?"Close Travel":"Travel",hint:"3",onClick:toggleTravelOverlay,disabled:!canTravel&& !state.ui.travelOpen},
        {key:"inventory",label:state.ui.showClassTree?"Hide Loadout":"Inventory",hint:"4",onClick:toggleLoadoutOverlay,disabled:state.phase!=="play"},
        {...contextAction,disabled:contextAction.key!=="brace"&&state.run.inCombat}
      ];
    })();

    const playHeaderTitle=state.phase==="dead"?"Beacon":state.run.site?.name||"Arcane Run";
    const playHeaderSubtitle=state.phase==="play"?`${modeLabel} • Depth ${state.run.depth||1}`:subtitle;
    const stageControls=[h(Button,{variant:"ghost",key:"loadout",onClick:toggleLoadoutOverlay},state.ui.showClassTree?"Hide Loadout":"Show Loadout")];

    const sidebarContent=[
      h(Card,{key:"toggles",title:"Sidebar Toggles",subtitle:"Panels + overlays"},
        h("div",{className:"df-toggle-list"},
          h(Button,{variant:"ghost",onClick:toggleLoadoutOverlay},"Toggle Loadout"),
          h(Button,{variant:"ghost",onClick:()=>setState(p=>({...p,ui:{...p.ui,showPromotion:!p.ui.showPromotion}})),disabled:state.phase!=="play"||state.player.xp<state.player.nextPromoAt||state.player.promoTier>0},"Promo Check"),
          h(Button,{variant:"ghost",onClick:saveGame},"Quick Save")
        )
      ),
      h(Card,{key:"vitals",title:"Vitals",subtitle:"Quick readout"},
        h("div",{className:"df-info-grid"},
          h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"HP"),h("div",{className:"df-info-value"},`${state.player.hp}/${state.player.hpMax}`)),
          h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"XP"),h("div",{className:"df-info-value"},state.player.xp)),
          h("div",{className:"df-info-pair"},h("div",{className:"df-info-label"},"Echoes"),h("div",{className:"df-info-value"},state.meta.echoes))
        )
      ),
      h("details",{key:"help",className:"df-side-collapse"},
        h("summary",null,"Help & Tips"),
        h("div",{className:"df-side-collapse__body"},h(DF.HelpPanel,null))
      )
    ];

    const viewportShell=h(DF.PlayWindow,{title:playHeaderTitle,subtitle:playHeaderSubtitle,viewport:viewportContent,overlay:overlayContent,controls:stageControls,actions:actionButtons,wipeKey:`${state.phase}-${state.run.inCombat?"combat":"field"}`});

    return h("div",{className:"df-app df-ui"},
      h(DF.GameShell,{
        title:"Dragonfall",
        subtitle:subtitle,
        versionLabel:`Arcane Run • v${DF.VERSION}`,
        hudPills,
        topActions,
        keyboardHints:["[Esc] Menu","[H] Help"],
        viewport:viewportShell,
        sidebar:sidebarContent,
        bottom:chatPanel
      }),
      h(DF.PromotionModal,{state,onLater:()=>setState(p=>({...p,ui:{...p.ui,showPromotion:false}})),onChooseElement:choosePromotionElement,onChooseCross:choosePromotionCross}),
      h(DF.Toast,{toast})
    );
  };
})();
