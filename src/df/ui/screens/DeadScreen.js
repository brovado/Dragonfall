(() => {
  const { React } = DF;
  const h = React.createElement;
  const { Button } = DF;

  const DeadScreen = ({ onRetry, onQuit }) => {
    const background = DF?.assets?.images?.ui_gameover;
    const src = background?.src;
    return h(
      "div",
      {
        className: "df-dead-screen",
        style: src ? { backgroundImage: `url(${src})` } : null,
      },
      h(
        "div",
        { className: "df-dead-screen__buttons" },
        h(
          Button,
          { variant: "primary", onClick: onRetry },
          "Retry"
        ),
        h(
          Button,
          { variant: "danger", onClick: onQuit },
          "Quit"
        )
      )
    );
  };

  DF.DeadScreen = DeadScreen;
  DF.ui = DF.ui || {};
  DF.ui.screens = DF.ui.screens || {};
  DF.ui.screens.DeadScreen = DeadScreen;
})();
