(() => {
  const DF = window.DF || {};
  DF.SCENES = Object.freeze({
    TITLE: "TITLE",
    PREP: "PREP",
    PLAY: "PLAY",
    GAMEOVER: "GAMEOVER",
    MENU: "MENU",
    TRAVEL_SPLASH: "TRAVEL_SPLASH",
  });
  DF.UI_SCREENS = Object.freeze({
    TITLE: "TITLE",
    PREP: "PREP",
    RUN: "RUN",
    RESULTS: "RESULTS",
  });
  window.DF = DF;
})();
