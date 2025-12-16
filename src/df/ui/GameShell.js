(() => {
  const {React}=DF; const {useEffect,useMemo,useRef,useState}=React; const h=React.createElement;
  DF.GameShell=({children})=>{
    const [time,setTime]=useState(()=>new Date());
    const logRef=useRef(null);
    useEffect(()=>{const id=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(id);},[]);
    const hud=useMemo(()=>{const s=DF.state||null; return {
      title:s?.player?.title||"Mountain Exile",
      hp:Number.isFinite(s?.player?.hp)?s.player.hp:null,
      hpMax:Number.isFinite(s?.player?.hpMax)?s.player.hpMax:null,
      xp:Number.isFinite(s?.player?.xp)?s.player.xp:null,
      gold:Number.isFinite(s?.player?.gold)?s.player.gold:null,
      echoes:Number.isFinite(s?.meta?.echoes)?s.meta.echoes:null,
    };},[DF.state]);
    return h("div",{className:"df-client"},
      h("div",{className:"df-overlay","aria-hidden":"true"}),
      h("div",{className:"df-frame"},
        h("div",{className:"df-hud"},
          h("div",{className:"df-hud-left"},
            h("div",{className:"df-title"},hud.title),
            h("div",{className:"df-sub"},`${time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} • v${DF.VERSION||"dev"}`)
          ),
          h("div",{className:"df-hud-right"},
            h("div",{className:"df-pill"},hud.hp!=null?`HP ${hud.hp}/${hud.hpMax}`:"HP —/—"),
            h("div",{className:"df-pill"},hud.xp!=null?`XP ${hud.xp}`:"XP —"),
            h("div",{className:"df-pill"},hud.echoes!=null?`Echoes ${hud.echoes}`:"Echoes —"),
            h("div",{className:"df-pill"},hud.gold!=null?`Gold ${hud.gold}`:"Gold —"),
          )
        ),
        h("div",{className:"df-viewport"},children),
        h("div",{className:"df-log",ref:logRef},
          h("div",{className:"df-log-label"},"EVENTS"),
          h("div",{className:"df-log-body"},
            h("div",{className:"df-log-line"},"• The wind bites. The mountain watches."),
            h("div",{className:"df-log-line"},"• Your choices will become scars.")
          )
        )
      )
    );
  };
})();