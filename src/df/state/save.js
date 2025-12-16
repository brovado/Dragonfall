(() => {
  const KEY="dragonfall_save_v041";
  DF.saveGame=(state)=>localStorage.setItem(KEY,JSON.stringify(state));
  DF.loadGame=()=>{const raw=localStorage.getItem(KEY); if(!raw) return null; return JSON.parse(raw);};
  DF.clearSave=()=>localStorage.removeItem(KEY);
})();