// src/df/ui/components/ActionBar.js
(() => {
  const { React } = DF;
  if (!React) return;
  const h = React.createElement;

  DF.ActionBar = ({ actions = [] }) => {
    const safe = (actions || []).filter(Boolean);
    return h(
      "div",
      { className: "df-actionbar" },
      h(
        "div",
        { className: "df-actionbar__list" },
        safe.map((action) =>
          h(
            "button",
            {
              key: action.key || action.label,
              className: "df-actionbar__button",
              onClick: action.onClick,
              disabled: action.disabled,
              type: "button",
              title: action.title || undefined,
            },
            h("span", { className: "df-actionbar__label" }, action.label || action.key),
            action.hint
              ? h("span", { className: "df-actionbar__hint" }, action.hint)
              : null
          )
        )
      )
    );
  };
})();
