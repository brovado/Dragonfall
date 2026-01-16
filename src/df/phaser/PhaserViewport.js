(() => {
  const DF = window.DF;
  if (!DF) return;
  const React = DF.React;
  if (!React) return;
  const h = React.createElement;

  function PhaserViewport({ fallback = null }) {
    const containerRef = React.useRef(null);
    const gameRef = React.useRef(null);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
      if (gameRef.current) return;
      const Phaser = window.Phaser;
      if (!Phaser) {
        setError(new Error("Phaser missing"));
        return;
      }

      try {
        const config = {
          type: Phaser.AUTO,
          parent: containerRef.current,
          width: 800,
          height: 450,
          backgroundColor: "#0b0f19",
          pixelArt: true,
          physics: {
            default: "arcade",
            arcade: { gravity: { y: 0 }, debug: false },
          },
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 450,
          },
          scene: [DF.PhaserBootScene, DF.PhaserCombatRoomScene],
        };

        gameRef.current = new Phaser.Game(config);
      } catch (err) {
        console.error("Failed to start Phaser", err);
        setError(err);
      }

      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }, []);

    if (error) {
      if (fallback) return h("div", { className: "df-phaser-viewport" }, fallback);
      return h(
        "div",
        { className: "df-playwindow__world-fallback" },
        "Viewport offline"
      );
    }

    return h("div", { className: "df-phaser-viewport" }, h("div", { className: "df-phaser-viewport__frame", ref: containerRef }));
  }

  DF.PhaserViewport = PhaserViewport;
})();
