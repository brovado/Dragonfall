(() => {
  DF.SITES=[
    {key:"ashway_bridge",name:"Ashway Bridge",tone:"Black water churns beneath a cracked span. Wind howls through broken stone ribs.",loot:["Iron Shards","Salt Rope","Old Sigil"]},
    {key:"ruined_relay",name:"Ruined Beacon Relay",tone:"A collapsed outpost with a dormant crystal core. Someone died here recently.",loot:["Relay Parts","Beacon Ink","Ration Bar"]},
    {key:"wyrm_path",name:"Wyrm Path",tone:"Claw marks score the rock. Heat breathes from the cracks like a sleeping furnace.",loot:["Scaled Fragment","Charcoal Resin","Bright Glass"]},
  ];
  DF.pickSite=(rng)=>DF.pick(DF.SITES,rng);
})();