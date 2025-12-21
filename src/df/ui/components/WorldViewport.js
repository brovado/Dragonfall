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

  function WorldViewport({ scale = DEFAULT_SCALE, nodeWeb, currentNodeId, availableTargets = [], selectedNodeId, onSelectNode }) {
    const canvasRef = React.useRef(null);
    const frameRef = React.useRef(null);
    const [currentScale, setCurrentScale] = React.useState(scale || DEFAULT_SCALE);
    const reachableSet = React.useMemo(() => new Set(availableTargets || []), [availableTargets]);
    const nodeLookup = React.useMemo(() => {
      const map = new Map();
      (nodeWeb?.nodes || []).forEach((n) => map.set(n.id, n));
      return map;
    }, [nodeWeb]);
    const visibleNodes = React.useMemo(() => {
      if (!nodeWeb || !nodeWeb.nodes) return [];
      return (nodeWeb.nodes || []).filter((n) => n.revealed || reachableSet.has(n.id) || n.id === currentNodeId);
    }, [nodeWeb, reachableSet, currentNodeId]);
    const visibleEdges = React.useMemo(() => {
      if (!nodeWeb || !nodeWeb.edges) return [];
      return (nodeWeb.edges || []).filter((e) => nodeLookup.has(e.a) && nodeLookup.has(e.b));
    }, [nodeWeb, nodeLookup]);

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

        const tileset = typeof DF.getImage === "function" ? DF.getImage("town_tiles") : DF?.assets?.images?.town_tiles || null;
        for (let y = 0; y < TEST_MAP.length; y += 1) {
          for (let x = 0; x < TEST_MAP[y].length; x += 1) {
            drawTile(ctx, tileset, TEST_MAP[y][x], x * TILE_SIZE, y * TILE_SIZE);
          }
        }

        const playerSprite =
          typeof DF.getImage === "function" ? DF.getImage("main_pc") : DF?.assets?.images?.main_pc || null;
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

    const renderOverlay = () => {
      if (!nodeWeb || !visibleNodes.length) return null;
      return h(
        "div",
        { className: "df-map-overlay" },
        h(
          "svg",
          {
            className: "df-map-overlay__graph",
            viewBox: "0 0 100 100",
            preserveAspectRatio: "none",
          },
          visibleEdges.map((edge, idx) => {
            const a = nodeLookup.get(edge.a);
            const b = nodeLookup.get(edge.b);
            return h("line", {
              key: idx,
              x1: a?.x || 0,
              y1: a?.y || 0,
              x2: b?.x || 0,
              y2: b?.y || 0,
            });
          })
        ),
        visibleNodes.map((node) => {
          const isCurrent = node.id === currentNodeId;
          const isReachable = reachableSet.has(node.id);
          const isSelected = selectedNodeId && node.id === selectedNodeId;
          const classes = ["df-map-node"];
          if (isCurrent) classes.push("df-map-node--current");
          if (isReachable) classes.push("df-map-node--reachable");
          if (node.cleared) classes.push("df-map-node--cleared");
          if (isSelected) classes.push("df-map-node--selected");
          return h(
            "button",
            {
              key: node.id,
              className: classes.join(" "),
              style: { left: `${node.x}%`, top: `${node.y}%` },
              title: node.site?.name || node.id,
              onClick: isReachable && typeof onSelectNode === "function" ? () => onSelectNode(node.id) : undefined,
              disabled: !isReachable,
              type: "button",
            },
            h("span", { className: "df-map-node__dot" }),
            h("span", { className: "df-map-node__label" }, node.site?.name || node.id)
          );
        })
      );
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
        }),
        renderOverlay()
      )
    );
  }

  DF.WorldViewport = WorldViewport;
  DF.ui = DF.ui || {};
  DF.ui.components = DF.ui.components || {};
  DF.ui.components.WorldViewport = WorldViewport;
})();
