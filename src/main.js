(() => {
  const root=document.getElementById("root");
  DF.assert(root,"#root missing");
  const {React,ReactDOM}=DF; const h=React.createElement;
  ReactDOM.render(h(DF.App),root);
})();
