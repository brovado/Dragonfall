(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;

  const Screens2 = DF.Screens2 || (DF.Screens2 = {});

  Screens2.ScreenRouter = ({ screen, screens = {}, transitionMs = 240 }) => {
    const [active, setActive] = React.useState(screen);
    const [exiting, setExiting] = React.useState(null);
    const [activeVisible, setActiveVisible] = React.useState(true);

    React.useEffect(() => {
      if (!screen || screen === active) return;
      setExiting(active);
      setActive(screen);
      setActiveVisible(false);
    }, [active, screen]);

    React.useEffect(() => {
      const id = window.requestAnimationFrame(() => setActiveVisible(true));
      return () => window.cancelAnimationFrame(id);
    }, [active]);

    React.useEffect(() => {
      if (!exiting) return undefined;
      const id = window.setTimeout(() => setExiting(null), transitionMs);
      return () => window.clearTimeout(id);
    }, [exiting, transitionMs]);

    const renderScreen = (key, className) => {
      const node = screens[key];
      if (!node) return null;
      return h("div", { key, className }, typeof node === "function" ? node() : node);
    };

    return h(
      "div",
      { className: "df-screen-router" },
      exiting ? renderScreen(exiting, "df-screen df-screen--outgoing") : null,
      active
        ? renderScreen(
            active,
            ["df-screen", "df-screen--active", activeVisible ? "df-screen--visible" : null].filter(Boolean).join(" ")
          )
        : null
    );
  };
})();
