(async () => {
  console.log("BOOT: starting…", location.href);
  if(!window.DF){ console.error("DF namespace missing."); return; }

  const files=[
    "./src/df/version.js","./src/df/utils.js","./src/df/rng.js",
    "./src/df/constants/dr.js","./src/df/constants/index.js",
    "./src/df/data/weapons.js","./src/df/data/elements.js","./src/df/data/enemies.js","./src/df/data/sites.js","./src/df/data/index.js",
    "./src/df/logic/dice.js","./src/df/logic/stats.js","./src/df/logic/skills.js","./src/df/logic/map.js","./src/df/logic/combat.js","./src/df/logic/index.js",
    "./src/df/state/log.js","./src/df/state/save.js","./src/df/state/newGame.js","./src/df/state/index.js",
    "./src/df/ui/components/Card.js","./src/df/ui/components/Pill.js","./src/df/ui/components/Button.js","./src/df/ui/components/Divider.js","./src/df/ui/components/PromotionModal.js","./src/df/ui/components/Toast.js","./src/df/ui/components/index.js",
    "./src/df/ui/panels/EventLog.js","./src/df/ui/panels/CharacterPanel.js","./src/df/ui/panels/HelpPanel.js","./src/df/ui/panels/index.js",
    "./src/df/ui/screens/PrepScreen.js","./src/df/ui/screens/PlayScreen.js","./src/df/ui/screens/DeadScreen.js","./src/df/ui/screens/index.js",
    "./src/df/ui/GameShell.js","./src/df/ui/App.js",
    "./src/main.js"
  ];

  const load=(src)=>new Promise((res,rej)=>{const s=document.createElement("script"); s.src=src; s.async=false;
    s.onload=()=>{console.log("BOOT: loaded",src); res();}; s.onerror=()=>rej(new Error("Failed to load: "+src));
    document.head.appendChild(s);
  });

  try{
    for(const f of files) await load(f);
    const required=["App","GameShell","mkNewGame"];
    const missing=required.filter(k=>!DF[k]);
    if(missing.length) throw new Error("Critical DF exports missing after boot: "+missing.join(", "));
    console.log("Dragonfall boot complete.");
  }catch(e){
    console.error(e);
    const el=document.getElementById("root");
    if(el) el.innerHTML=`<pre style="color:#fff; padding:16px;">BOOT ERROR:\n${String(e)}</pre>`;
  }
})();