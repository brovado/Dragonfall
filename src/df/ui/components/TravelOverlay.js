// src/df/ui/components/TravelOverlay.js
(() => {
  const { React, Button } = DF;
  if (!React) return;
  const h = React.createElement;

  const TravelOverlay = ({
    currentNode,
    options = [],
    allNodes = [],
    selectedId = null,
    onSelect,
    onConfirm,
    onClose,
  }) => {
    const hasRoutes = options.length > 0;
    const selected = options.find((n) => n.id === selectedId);

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
                "button",
                {
                  key: node.id,
                  className: [
                    "df-travel__option",
                    selected && selected.id === node.id ? "df-travel__option--selected" : null,
                  ]
                    .filter(Boolean)
                    .join(" "),
                  onClick: () => typeof onSelect === "function" && onSelect(node.id),
                  type: "button",
                },
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
                h("div", { className: "df-travel__option-cta" }, node.id === selected?.id ? "Selected" : "Select")
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
      h(
        "div",
        { className: "df-travel__footer" },
        h(
          Button || "button",
          {
            variant: "primary",
            onClick: () => typeof onConfirm === "function" && onConfirm(selected?.id),
            disabled: !selected || typeof onConfirm !== "function",
          },
          selected ? `Travel to ${selected.site?.name || selected.id}` : "Choose a destination"
        ),
        hasRoutes || !(allNodes && allNodes.length)
          ? null
          : h(
              "div",
              { className: "df-panel__note" },
              `Visible sites: ${allNodes.map((n) => n.site?.name || n.id).join(", ")}`
            )
      )
    );
  };

  DF.TravelOverlay = TravelOverlay;
  DF.ui = DF.ui || {};
  DF.ui.components = DF.ui.components || {};
  DF.ui.components.TravelOverlay = TravelOverlay;
})();
