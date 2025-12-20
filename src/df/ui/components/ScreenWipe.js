// src/df/ui/components/ScreenWipe.js
(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;
  const { useEffect, useState } = React;

  DF.ScreenWipe = ({ activeKey, duration = 200 }) => {
    const [phase, setPhase] = useState("idle");
    const [visible, setVisible] = useState(false);
    const transitionImg = DF?.assets?.images?.ui_transition;
    const src = transitionImg?.src;

    useEffect(() => {
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
    }, [activeKey, duration]);

    if (!visible && phase === "idle") return null;
    return h(
      "div",
      {
        className: `df-screenwipe df-screenwipe--${phase}`,
        "aria-hidden": "true",
      },
      src ? h("img", { className: "df-screenwipe__img", src, alt: "" }) : null
    );
  };
})();
