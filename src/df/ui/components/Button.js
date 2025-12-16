(() => {
  const {React}=DF; const h=React.createElement;
  DF.Button=({children,onClick,variant="primary",disabled,title})=>{
    const base="rounded-xl px-3 py-2 text-sm font-medium border transition active:scale-[0.99]";
    const styles={primary:"bg-white text-black border-white/20 hover:bg-white/90 disabled:opacity-50",ghost:"bg-white/5 text-white border-white/10 hover:bg-white/10 disabled:opacity-50",danger:"bg-red-500/15 text-red-200 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"};
    return h("button",{className:`${base} ${styles[variant]||styles.primary}`,onClick,disabled,title},children);
  };
})();