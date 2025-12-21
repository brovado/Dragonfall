// src/df/ui/components/ScreenWipe.js
(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;
  const { useEffect, useState } = React;

  DF.ScreenWipe = ({ wipeState, duration = 240 }) => {
    const [phase, setPhase] = useState("idle");
    const [visible, setVisible] = useState(false);
    const token = wipeState?.token || wipeState?.scene || wipeState?.mode || "wipe";
    const transitionImg = typeof DF.getImage === "function" ? DF.getImage("ui_transition") : DF?.assets?.images?.ui_transition;
    const src = transitionImg?.src;

    useEffect(() => {
      if (!wipeState?.active) {
        setVisible(false);
        setPhase("idle");
        return;
      }
      setVisible(true);
      setPhase("enter");
      const mid = window.setTimeout(() => setPhase("exit"), duration);
      const end = window.setTimeout(() => {
        setVisible(false);
        setPhase("idle");
      }, duration * 2);
      return () => {
        window.clearTimeout(mid);
        window.clearTimeout(end);
      };
    }, [token, duration, wipeState?.active, wipeState?.mode]);

    if (!visible && phase === "idle") return null;
    return h(
      "div",
      {
        className: `df-screenwipe df-screenwipe--${phase} df-screenwipe--mode-${wipeState?.mode || "idle"}`,
        "aria-hidden": "true",
      },
      src ? h("img", { className: "df-screenwipe__img", src, alt: "" }) : null
    );
  };
})();
