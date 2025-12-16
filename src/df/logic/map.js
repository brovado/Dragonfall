(() => {
  DF.createNodeWeb=(rng)=>{
    const nodes=[],edges=[];
    const types=["fight","fight","fight","event","station","event","fight"];
    const coords=[{x:12,y:55},{x:28,y:35},{x:28,y:75},{x:48,y:25},{x:50,y:55},{x:48,y:85},{x:74,y:55}];
    for(let i=0;i<coords.length;i++) nodes.push({id:`n${i}`,...coords[i],kind:types[i],revealed:i===0,cleared:false,site:DF.pickSite(rng)});
    [["n0","n1"],["n0","n2"],["n1","n3"],["n1","n4"],["n2","n4"],["n2","n5"],["n3","n6"],["n4","n6"],["n5","n6"]].forEach(([a,b])=>edges.push({a,b}));
    return {nodes,edges};
  };
})();