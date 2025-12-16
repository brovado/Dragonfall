(() => {
  const DF = (window.DF = window.DF || {});
  DF.React = window.React;
  DF.ReactDOM = window.ReactDOM;
  DF.assert = (cond, msg) => { if (!cond) throw new Error(msg); };
})();