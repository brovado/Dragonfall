// src/df/ui/components/WorldViewport.js
(() => {
  const DF = window.DF;
  if (!DF) return;
  const React = DF.React;
  if (!React) return;
  const h = React.createElement;

  const VIEW_WIDTH = 160;
  const VIEW_HEIGHT = 144;
  const TILE_SIZE = 16;
  const DEFAULT_SCALE = 4;
  const PLAYER_TILE_SIZE = 16;

  const TEST_MAP = [
    [34, 34, 34, 34, 34, 34, 34, 34, 34, 34],
    [34, 1, 1, 1, 1, 1, 1, 1, 1, 34],
    [34, 1, 0, 0, 0, 0, 0, 0, 1, 34],
    [34, 1, 0, 18, 18, 18, 18, 0, 1, 34],
    [34, 1, 0, 18, 5, 5, 18, 0, 1, 34],
    [34, 1, 0, 18, 18, 18, 18, 0, 1, 34],
    [34, 1, 0, 0, 0, 0, 0, 0, 1, 34],
    [34, 1, 1, 1, 1, 1, 1, 1, 1, 34],
    [34, 34, 34, 34, 34, 34, 34, 34, 34, 34],
  ];

  const drawTile = (ctx, tileset, tileIndex, dx, dy) => {
    if (!ctx) return;
    if (!tileset) {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
      return;
    }

    const tilesPerRow = Math.max(1, Math.floor(tileset.width / TILE_SIZE));
    const idx = Math.max(0, Math.floor(tileIndex || 0));
    const sx = (idx % tilesPerRow) * TILE_SIZE;
    const sy = Math.floor(idx / tilesPerRow) * TILE_SIZE;

    ctx.drawImage(tileset, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
  };

  function WorldViewport({ scale = DEFAULT_SCALE }) {
    const canvasRef = React.useRef(null);
    const frameRef = React.useRef(null);
    const [currentScale, setCurrentScale] = React.useState(scale || DEFAULT_SCALE);

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let rafId = null;

      const render = () => {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
        ctx.fillStyle = "#0b0f19";
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

        const tileset = DF?.assets?.images?.town_tiles || null;
        for (let y = 0; y < TEST_MAP.length; y += 1) {
          for (let x = 0; x < TEST_MAP[y].length; x += 1) {
            drawTile(ctx, tileset, TEST_MAP[y][x], x * TILE_SIZE, y * TILE_SIZE);
          }
        }

        const playerSprite = DF?.assets?.images?.main_pc || null;
        const centerX = Math.floor((TEST_MAP[0]?.length || 1) / 2) * TILE_SIZE;
        const centerY = Math.floor(TEST_MAP.length / 2) * TILE_SIZE;

        if (playerSprite) {
          const perRow = Math.max(1, Math.floor(playerSprite.width / PLAYER_TILE_SIZE));
          const sx = (0 % perRow) * PLAYER_TILE_SIZE;
          const sy = 0;
          ctx.drawImage(
            playerSprite,
            sx,
            sy,
            PLAYER_TILE_SIZE,
            PLAYER_TILE_SIZE,
            centerX,
            centerY - 2,
            PLAYER_TILE_SIZE,
            PLAYER_TILE_SIZE
          );
        } else {
          ctx.fillStyle = "#a5f3fc";
          ctx.fillRect(centerX, centerY - 2, PLAYER_TILE_SIZE, PLAYER_TILE_SIZE);
        }

        rafId = window.requestAnimationFrame(render);
      };

      rafId = window.requestAnimationFrame(render);
      return () => {
        if (rafId) window.cancelAnimationFrame(rafId);
      };
    }, []);

    React.useLayoutEffect(() => {
      const node = frameRef.current;
      if (!node) return;
      const resize = () => {
        const rect = node.getBoundingClientRect();
        const maxScale = Math.max(
          1,
          Math.floor(Math.min(rect.width / VIEW_WIDTH, rect.height / VIEW_HEIGHT) || DEFAULT_SCALE)
        );
        setCurrentScale(Math.max(1, maxScale));
      };
      resize();
      const obs = new ResizeObserver(resize);
      obs.observe(node);
      return () => obs.disconnect();
    }, []);

    const canvasStyle = {
      width: `${VIEW_WIDTH * currentScale}px`,
      height: `${VIEW_HEIGHT * currentScale}px`,
    };

    return h(
      "div",
      { className: "df-world-viewport" },
      h(
        "div",
        { className: "df-world-viewport__frame", ref: frameRef },
        h("canvas", {
          ref: canvasRef,
          width: VIEW_WIDTH,
          height: VIEW_HEIGHT,
          style: canvasStyle,
          className: "df-world-viewport__canvas",
        })
      )
    );
  }

  DF.WorldViewport = WorldViewport;
  DF.ui = DF.ui || {};
  DF.ui.components = DF.ui.components || {};
  DF.ui.components.WorldViewport = WorldViewport;
})();
