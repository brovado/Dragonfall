(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;

  const Screens2 = DF.Screens2 || (DF.Screens2 = {});

  Screens2.TitleScreen = ({ imageSrc, onStart }) =>
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
          h("div", { className: "df-title-card__eyebrow" }, "Beacon Protocol"),
          h("div", { className: "df-title-card__title" }, "Dragonfall"),
          h("div", { className: "df-title-card__subtitle" }, "Light the beacon. Brave the mountain."),
          h(
            "div",
            { className: "df-title-card__actions" },
            h("button", { className: "df-title-card__btn", onClick: onStart, type: "button" }, "Start Run")
          )
        )
      ),
      !imageSrc
        ? h("div", { className: "df-title-screen__fallback" }, "TITLE OK • Background missing")
        : null
    );
})();
