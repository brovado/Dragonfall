// src/df/ui/components/PlayWindow.js
(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;

  DF.PlayWindow = ({ worldLayer, overlayLayer, dialogLayer, actionLayer, sceneWipe }) =>
    h(
      "div",
      { className: "df-playwindow df-ui" },
      h(
        "div",
        { className: "df-playwindow__frame" },
        h("div", { className: "df-playwindow__world-layer" }, worldLayer),
        overlayLayer ? h("div", { className: "df-playwindow__overlay-layer" }, overlayLayer) : null,
        dialogLayer ? h("div", { className: "df-playwindow__dialog-layer" }, dialogLayer) : null,
        actionLayer ? h("div", { className: "df-playwindow__action-layer" }, actionLayer) : null,
        h(DF.ScreenWipe, { wipeState: sceneWipe || { active: false } })
      )
    );
})();
