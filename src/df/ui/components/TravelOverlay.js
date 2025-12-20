// src/df/ui/components/TravelOverlay.js
(() => {
  const { React, Button } = DF;
  if (!React) return;
  const h = React.createElement;

  const TravelOverlay = ({ currentNode, options = [], allNodes = [], onTravel, onClose }) => {
    const hasRoutes = options.length > 0;

    return h(
      "div",
      { className: "df-travel" },
      h(
        "div",
        { className: "df-travel__header" },
        h("div", { className: "df-panel__section-title" }, "Travel"),
        onClose
          ? h(
              Button || "button",
              { variant: "ghost", onClick: onClose, className: "df-btn" },
              "Close"
            )
          : null
      ),
      h(
        "div",
        { className: "df-panel__note" },
        currentNode
          ? `Current: ${currentNode.site?.name || currentNode.id}. Choose a connected site to travel.`
          : "Choose a destination to travel to."
      ),
      h(
        "div",
        { className: "df-travel__list" },
        hasRoutes
          ? options.map((node) =>
              h(
                "div",
                { key: node.id, className: "df-travel__option" },
                h(
                  "div",
                  null,
                  h("div", { className: "df-travel__option-title" }, node.site?.name || node.id),
                  h(
                    "div",
                    { className: "df-travel__option-sub" },
                    [node.kind || "site", node.cleared ? "cleared" : "live"].join(" • ")
                  )
                ),
                h(
                  Button || "button",
                  {
                    variant: "primary",
                    onClick: () => typeof onTravel === "function" && onTravel(node.id),
                    disabled: typeof onTravel !== "function",
                  },
                  "Travel"
                )
              )
            )
          : h(
              "div",
              { className: "df-travel__empty" },
              allNodes && allNodes.length
                ? "No adjacent destinations yet. Reveal more nodes from your current position."
                : "No reachable destinations yet."
            )
      ),
      hasRoutes || !(allNodes && allNodes.length)
        ? null
        : h(
            "div",
            { className: "df-panel__note" },
            `Visible sites: ${allNodes.map((n) => n.site?.name || n.id).join(", ")}`
          )
    );
  };

  DF.TravelOverlay = TravelOverlay;
  DF.ui = DF.ui || {};
  DF.ui.components = DF.ui.components || {};
  DF.ui.components.TravelOverlay = TravelOverlay;
})();
