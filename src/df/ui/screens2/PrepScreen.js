(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;

  const Screens2 = DF.Screens2 || (DF.Screens2 = {});

  Screens2.PrepScreen = ({ state, onPromptChoice }) => {
    const log = state.run?.log || [];
    return h(
      "div",
      { className: "df-prep-screen df-screen__fill" },
      h(
        "div",
        { className: "df-prep-screen__panel" },
        h(
          "div",
          { className: "df-prep-screen__header" },
          h("div", { className: "df-prep-screen__title" }, "Preparation"),
          h("div", { className: "df-prep-screen__subtitle" }, "Choose your starting weapon and style.")
        ),
        h(
          "div",
          { className: "df-prep-screen__grid" },
          h("div", { className: "df-prep-screen__loadout" }, h(DF.PrepScreen, { state })),
          h(
            "div",
            { className: "df-prep-screen__log" },
            h("div", { className: "df-prep-screen__log-title" }, "Run Log"),
            h(DF.EventLog, {
              log,
              onPromptChoice,
            })
          )
        )
      )
    );
  };
})();
