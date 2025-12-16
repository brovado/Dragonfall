(() => {
  DF.pickEnemy=(rng)=>DF.pick(DF.ENEMIES,rng);
  DF.resolveEnemyTurn=(draft,takeDamage,context="combat")=>{
    const enemy=draft.run.enemy; if(!enemy) return;
    const rng=DF.mulberry32(draft.rngSeed^draft.run.depth^0x1111^draft.run.enemyHP);
    const defMod=DF.computeDefenseMod(draft.player.stats,draft.player.style);
    const defend=!!draft.run._defendActive;
    const braceBonus=defend?2:0;
    const check=DF.rollCheck(rng,`${enemy.name} attacks`,defMod+braceBonus,enemy.attackDR);
    DF.pushLog(draft,{type:"roll",text:`${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${check.success?"HIT":"MISS"}`});
    if(check.success){
      let dmg=DF.rollDamage(rng,enemy.dmg[0],enemy.dmg[1]);
      if(defend) dmg=Math.max(0,dmg-1-(draft.player.element==="earth"?1:0));
      takeDamage(draft,dmg,context);
    } else DF.pushLog(draft,{type:"system",text:"You avoid the blow."});
    draft.run._defendActive=false;
  };
})();