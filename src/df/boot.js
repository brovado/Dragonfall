(async () => {
  console.log("BOOT: starting…", location.href);
  if(!window.DF){ console.error("DF namespace missing."); return; }

  const root=document.getElementById("root");
  let statusEl=null;
  const setStatus=(headline,detail)=>{ if(!root) return;
    if(!statusEl){
      statusEl=document.createElement("div");
      statusEl.id="df-boot-status";
      statusEl.style.cssText="padding:28px; color:#e2e8f0; font-family:ui-monospace,monospace; text-align:center; line-height:1.5; background:#0b0f19;";
      root.innerHTML="";
      root.appendChild(statusEl);
    }
    statusEl.innerHTML=`<div style="font-size:12px; letter-spacing:0.08em; opacity:0.7;">DRAGONFALL</div><div style="font-size:16px; margin-top:6px;">${headline}</div>${detail?`<div style="font-size:14px; opacity:0.8; margin-top:4px;">${detail}</div>`:""}`;
  };
  const clearStatus=()=>{ if(statusEl && root.contains(statusEl)) root.removeChild(statusEl); };

  const mainFile="./src/main.js";
  const files=[
    "./src/df/version.js","./src/df/utils.js","./src/df/rng.js",
    "./src/df/assets.js",
    "./src/df/constants/dr.js","./src/df/constants/index.js",
    "./src/df/data/weapons.js","./src/df/data/elements.js","./src/df/data/enemies.js","./src/df/data/sites.js","./src/df/data/index.js",
    "./src/df/logic/dice.js","./src/df/logic/stats.js","./src/df/logic/skills.js","./src/df/logic/map.js","./src/df/logic/combat.js","./src/df/logic/index.js",
    "./src/df/state/log.js","./src/df/state/save.js","./src/df/state/newGame.js","./src/df/state/index.js",
    "./src/df/ui/components/Card.js","./src/df/ui/components/Pill.js","./src/df/ui/components/Button.js","./src/df/ui/components/Divider.js","./src/df/ui/components/PromotionModal.js","./src/df/ui/components/Toast.js","./src/df/ui/components/WorldViewport.js","./src/df/ui/components/ActionBar.js","./src/df/ui/components/TravelOverlay.js","./src/df/ui/components/ScreenWipe.js","./src/df/ui/components/PlayWindow.js","./src/df/ui/components/index.js",
    "./src/df/ui/panels/EventLog.js","./src/df/ui/panels/CharacterPanel.js","./src/df/ui/panels/HelpPanel.js","./src/df/ui/panels/index.js",
    "./src/df/ui/screens/PrepScreen.js","./src/df/ui/screens/PlayScreen.js","./src/df/ui/screens/DeadScreen.js","./src/df/ui/screens/index.js",
    "./src/df/ui/GameShell.js","./src/df/ui/App.js"
  ];

  const load=(src)=>new Promise((res,rej)=>{const s=document.createElement("script"); s.src=src; s.async=false;
    s.onload=()=>{console.log("BOOT: loaded",src); res();}; s.onerror=()=>rej(new Error("Failed to load: "+src));
    document.head.appendChild(s);
  });

  try{
    setStatus("Loading core…");
    for(const f of files){ setStatus("Loading scripts…",f); await load(f); }

    if(!DF.preloadAssets) throw new Error("Asset loader missing.");
    const totalAssets=(DF.ASSET_MANIFEST.images?.length||0)+(DF.ASSET_MANIFEST.audio?.length||0)+(DF.ASSET_MANIFEST.data?.length||0);
    setStatus("Preloading assets…",`${totalAssets} file(s)`);
    await DF.preloadAssets({
      onProgress:({done,total,entry})=>{
        console.log(`BOOT: asset ${done}/${total}: ${entry.key}`);
        setStatus("Preloading assets…",`${done}/${total} • ${entry.key}`);
      }
    });

    setStatus("Starting client…");
    await load(mainFile);
    const required=["App","GameShell","mkNewGame"];
    const missing=required.filter(k=>!DF[k]);
    if(missing.length) throw new Error("Critical DF exports missing after boot: "+missing.join(", "));
    clearStatus();
    console.log("Dragonfall boot complete.");
  }catch(e){
    console.error(e);
    const el=document.getElementById("root");
    if(el) el.innerHTML=`<pre style="color:#fff; padding:16px;">BOOT ERROR:\n${String(e)}</pre>`;
  }
})();
