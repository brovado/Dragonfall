(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;

  const Screens2 = DF.Screens2 || (DF.Screens2 = {});

  Screens2.RunScreen = ({
    state,
    hudPills,
    modeLabel,
    worldLayer,
    overlayLayer,
    log,
    onPromptChoice,
    actionButtons,
    sceneWipe,
    isOverlayActive,
  }) => {
    const [logOpen, setLogOpen] = React.useState(false);
    const [actionsOpen, setActionsOpen] = React.useState(true);

    React.useEffect(() => {
      const handleKey = (event) => {
        if (event.key === "l" || event.key === "L") {
          setLogOpen((prev) => !prev);
        }
        if (event.key === "k" || event.key === "K") {
          setActionsOpen((prev) => !prev);
        }
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, []);

    const dialogLayer = logOpen
      ? h("div", { className: "df-playwindow__dialog-shell" }, h(DF.EventLog, { log, onPromptChoice }))
      : null;

    const actionLayer = actionsOpen ? h(DF.ActionBar, { actions: actionButtons }) : null;

    return h(
      "div",
      { className: "df-run-screen df-screen__fill" },
      h(
        "div",
        { className: "df-run-hud" },
        h(
          "div",
          { className: "df-run-hud__title" },
          h("div", { className: "df-run-hud__name" }, "Dragonfall"),
          h("div", { className: "df-run-hud__mode" }, modeLabel)
        ),
        h("div", { className: "df-run-hud__pills" }, ...(hudPills || [])),
        h(
          "div",
          { className: "df-run-hud__controls" },
          h(
            "button",
            {
              className: "df-run-hud__btn",
              onClick: () => setLogOpen((prev) => !prev),
              type: "button",
            },
            `${logOpen ? "Hide" : "Show"} Log`,
            h("span", { className: "df-run-hud__hint" }, "L")
          ),
          h(
            "button",
            {
              className: "df-run-hud__btn",
              onClick: () => setActionsOpen((prev) => !prev),
              type: "button",
            },
            `${actionsOpen ? "Hide" : "Show"} Commands`,
            h("span", { className: "df-run-hud__hint" }, "K")
          )
        )
      ),
      h(DF.PlayWindow, {
        key: state.ui?.scene || "run",
        worldLayer,
        overlayLayer,
        dialogLayer: isOverlayActive ? null : dialogLayer,
        actionLayer: isOverlayActive ? null : actionLayer,
        sceneWipe,
      })
    );
  };
})();
