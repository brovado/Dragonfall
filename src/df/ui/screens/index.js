(() => {
  DF.ui = DF.ui || {};
  DF.ui.screens = DF.ui.screens || {};

  const screens = {
    PrepScreen: DF.PrepScreen,
    PlayScreen: DF.PlayScreen,
    DeadScreen: DF.DeadScreen,
  };

  Object.entries(screens).forEach(([key, comp]) => {
    if (comp) DF.ui.screens[key] = comp;
  });
})();
