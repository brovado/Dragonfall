(() => {
  const {React}=DF; const h=React.createElement;
  DF.Button=({children,onClick,variant="primary",disabled,title})=>{
    const base="df-btn";
    const styles={primary:"df-btn--primary",ghost:"df-btn--ghost",danger:"df-btn--danger"};
    return h("button",{className:`${base} ${styles[variant]||styles.primary}`,onClick,disabled,title,type:"button"},children);
  };
})();
