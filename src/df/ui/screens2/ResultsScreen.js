(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;

  const Screens2 = DF.Screens2 || (DF.Screens2 = {});

  Screens2.ResultsScreen = ({ imageSrc, onRetry, onQuit }) =>
    h(
      "div",
      {
        className: "df-title-screen df-screen__fill",
        style: imageSrc ? { backgroundImage: `url(${imageSrc})` } : undefined,
      },
      h(
        "div",
        { className: "df-title-screen__content" },
        h(
          "div",
          { className: "df-title-card" },
          h("div", { className: "df-title-card__eyebrow" }, "Run Ended"),
          h("div", { className: "df-title-card__title" }, "Beacon Offline"),
          h("div", { className: "df-title-card__subtitle" }, "The mountain keeps what you failed to extract."),
          h(
            "div",
            { className: "df-title-card__actions" },
            h("button", { className: "df-title-card__btn", onClick: onRetry, type: "button" }, "Retry"),
            h("button", { className: "df-title-card__btn df-title-card__btn--ghost", onClick: onQuit, type: "button" }, "Quit to Prep")
          )
        )
      ),
      !imageSrc ? h("div", { className: "df-title-screen__fallback" }, "Beacon offline") : null
    );
})();
