(() => {
  DF.mkNewGame=(seed=Date.now())=>{
    const gameId=DF.uid(); const rngSeed=(seed^gameId.length)>>>0;
    return {version:DF.VERSION,gameId,rngSeed,phase:"start",screen:"PrepScreen",book:{chapter:1,page:1},
      meta:{echoes:0,legacy:{startHP:0,revealHints:0}},
      player:{weapon:null,style:null,element:null,crossStyle:null,baseStats:{might:0,finesse:0,wits:0,will:0},stats:{might:0,finesse:0,wits:0,will:0},
        hpMax:10,hp:10,gold:0,xp:0,promoTier:0,nextPromoAt:4,inventory:[],extracted:[],stationBuilt:0,title:"Unbound"},
      run:{depth:0,region:"Ember March",nodeWeb:null,currentNodeId:null,site:null,danger:null,inCombat:false,enemy:null,enemyHP:0,log:[],status:"exploring"},
      ui:{showPromotion:false,selectedNode:null,travelOpen:false,menuOpen:false,sidebarCollapsed:false,promptedWeapon:false,promptedStyle:false,scene:DF.SCENES?.TITLE||"TITLE",scenePayload:null}
    };
  };
})();
