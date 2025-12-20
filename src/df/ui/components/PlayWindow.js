// src/df/ui/components/PlayWindow.js
(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;

  DF.PlayWindow = ({ title, subtitle, viewport, overlay, controls, actions, wipeKey }) =>
    h(
      "div",
      { className: "df-playwindow df-ui" },
      h(
        "div",
        { className: "df-playwindow__stage" },
        h(DF.ScreenWipe, { activeKey: wipeKey || title }),
        h(
          "div",
          { className: "df-playwindow__header" },
          h(
            "div",
            { className: "df-playwindow__titles" },
            h("div", { className: "df-playwindow__title" }, title || "Play Window"),
            subtitle ? h("div", { className: "df-playwindow__subtitle" }, subtitle) : null
          ),
          controls ? h("div", { className: "df-playwindow__controls" }, controls) : null
        ),
        h("div", { className: "df-playwindow__main" }, viewport),
        overlay
          ? h(
              "div",
              { className: "df-playwindow__overlay" },
              h("div", { className: "df-playwindow__panel" }, overlay)
            )
          : null
      ),
      h(DF.ActionBar, { actions })
    );
})();
