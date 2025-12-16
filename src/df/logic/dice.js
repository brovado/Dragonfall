(() => {
  DF.rollCheck=(rng,label,statBonus,dr)=>{const d20=DF.rollDie(rng,20);const total=d20+statBonus;return {label,d20,statBonus,total,dr,success:total>=dr};};
  DF.rollDamage=(rng,min,max)=>min+Math.floor(rng()*(max-min+1));
})();