(() => {
  const { React } = DF;
  const { useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;

  class ErrorBoundary extends React.Component {
    constructor(p) {
      super(p);
      this.state = { error: null };
      this.handleReload = this.handleReload.bind(this);
    }
    static getDerivedStateFromError(error) {
      return { error };
    }
    componentDidCatch(error, info) {
      console.error("UI crash", error, info);
    }
    handleReload() {
      if (typeof window != "undefined") window.location.reload();
    }
    render() {
      if (this.state.error) {
        const msg = this.state.error?.message || String(this.state.error);
        return h(
          "div",
          { className: "df-error-boundary" },
          h(
            "div",
            { className: "df-error-panel" },
            h("div", { className: "df-error-title" }, "Something went wrong."),
            h("div", { className: "df-error-message" }, msg),
            h("button", { className: "df-button df-button--danger", onClick: this.handleReload }, "Reload")
          )
        );
      }
      return this.props.children;
    }
  }

  DF.App = () => {
    const defaultScene = DF.SCENES?.TITLE || "TITLE";
    const prepareStateSafe = React.useCallback(
      (draft) => {
        if (DF.director?.prepareState) return DF.director.prepareState(draft);
        return draft;
      },
      []
    );
    const mkInitialState = () => prepareStateSafe(structuredClone(DF.mkNewGame()));
    const [state, setState] = useState(mkInitialState);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const stateRef = useRef(state);
    const missingAssetsRef = useRef(new Set());
    const scene = state.ui.scene || defaultScene;

    const setStateSafe = React.useCallback(
      (updater) =>
        setState((prev) => {
          const draft = prepareStateSafe(structuredClone(prev));
          return typeof updater === "function" ? updater(draft) : draft;
        }),
      [prepareStateSafe]
    );

    useEffect(() => {
      stateRef.current = state;
      DF.state = state;
    }, [state]);

    useEffect(() => {
      if (!DF.director) return;
      DF.director.bind({ getState: () => stateRef.current, setState: setStateSafe });
      if (typeof DF.director.bootstrap === "function") DF.director.bootstrap();
    }, [setStateSafe]);

    useEffect(() => {
      if (state.phase !== "play") return;
      if (state.run.inCombat) return;
      DF.director.act("CHECK_NODE");
    }, [state.phase, state.run.inCombat, state.run.danger, state.run.currentNodeId]);

    const imageFor = React.useCallback(
      (key) => (typeof DF.getImage === "function" ? DF.getImage(key, { warn: false }) : DF.assets?.images?.[key]),
      []
    );

    const warnMissingAsset = React.useCallback(
      (key) => {
        if (!key || missingAssetsRef.current.has(key)) return;
        missingAssetsRef.current.add(key);
        setStateSafe((draft) => {
          if (!draft?.run) return draft;
          DF.pushLog(draft, { type: "system", text: `Missing asset: ${key}` });
          return draft;
        });
      },
      [setStateSafe]
    );

    useEffect(() => {
      const keysToConfirm = ["ui_title", "ui_transition", "ui_gameover", "town_tiles", "main_pc"];
      keysToConfirm.forEach((k) => {
        if (!imageFor(k)) warnMissingAsset(k);
      });
    }, [imageFor, warnMissingAsset, scene]);

    const imageSrcFor = React.useCallback((key) => imageFor(key)?.src || null, [imageFor]);

    const travelOptions = useMemo(
      () => DF.director?.getTravelOptions?.(state) || [],
      [state, state.run?.nodeWeb, state.run?.currentNodeId, state.ui?.selectedNode]
    );

    const showToast = (msg) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2200);
    };

    const subtitle =
      scene === DF.SCENES.TITLE
        ? "Title Screen"
        : scene === DF.SCENES.GAMEOVER || state.phase === "dead"
        ? "☠️ Fallen"
        : state.phase === "play"
        ? "In the Mountain"
        : "Preparation";
    const modeLabel = (() => {
      if (scene === DF.SCENES.TITLE) return "Title";
      if (scene === DF.SCENES.GAMEOVER) return "Run Ended";
      if (state.phase !== "play") return subtitle;
      if (state.run.inCombat) return "In Combat";
      if (state.run.status === "traveling") return "Traveling";
      if (state.run.status === "resting") return "Resting";
      return "Exploring";
    })();

    const hudPills = [
      h("div", { key: "hp", className: "df-hud-pill" }, `HP ${state.player.hp}/${state.player.hpMax}`),
      h("div", { key: "xp", className: "df-hud-pill" }, `XP ${state.player.xp}`),
      h("div", { key: "echoes", className: "df-hud-pill" }, `Echoes ${state.meta.echoes}`),
      h("div", { key: "gold", className: "df-hud-pill" }, `Gold ${state.player.gold}`),
    ];

    const chatLog = state.run.log || [];
    const dialogLayer = h(
      "div",
      { className: "df-playwindow__dialog-shell" },
      h(DF.EventLog, {
        log: chatLog,
        onPromptChoice: (promptId, choice) => DF.director.act("PROMPT_CHOICE", { promptId, choice }),
      })
    );

    const latestStory =
      (state.run.log?.find((l) => l.type === "story") || state.run.log?.[state.run.log.length - 1] || {})?.text ||
      "The mountain waits.";
    const worldCard = h(
      "div",
      { className: "df-world-viewport__frame" },
      h("div", { className: "df-viewport-card__title" }, state.phase === "dead" ? "Beacon View" : "Field View"),
      h(
        "div",
        { className: "df-viewport-card__canvas" },
        DF.PhaserViewport
          ? h(DF.PhaserViewport, {
              fallback: DF.WorldViewport
                ? h(DF.WorldViewport, {
                    scale: 4,
                    nodeWeb: state.run.nodeWeb,
                    currentNodeId: state.run.currentNodeId,
                    availableTargets: travelOptions,
                    selectedNodeId: state.ui.selectedNode,
                    onSelectNode: (id) => {
                      DF.director.act("TRAVEL_SELECT", { nodeId: id });
                      DF.director.act("TRAVEL_OPEN");
                    },
                  })
                : h("div", { className: "df-playwindow__world-fallback" }, "Loading viewport…"),
            })
          : h(DF.WorldViewport, {
              scale: 4,
              nodeWeb: state.run.nodeWeb,
              currentNodeId: state.run.currentNodeId,
              availableTargets: travelOptions,
              selectedNodeId: state.ui.selectedNode,
              onSelectNode: (id) => {
                DF.director.act("TRAVEL_SELECT", { nodeId: id });
                DF.director.act("TRAVEL_OPEN");
              },
            })
      ),
      h(
        "div",
        { className: "df-viewport-card__hint" },
        h("div", { className: "df-viewport-card__hint-main" }, latestStory),
        h("div", { className: "df-viewport-card__hint-sub" }, modeLabel)
      )
    );

    const overlayCard = (title, actions = []) =>
      h(
        "div",
        { className: "df-overlay-card" },
        h("div", { className: "df-overlay-card__title" }, title),
        h(
          "div",
          { className: "df-overlay-card__actions" },
          actions.map((a) =>
            h(
              "button",
              {
                key: a.key || a.label,
                className: ["df-overlay-card__btn", a.primary ? "df-overlay-card__btn--primary" : null]
                  .filter(Boolean)
                  .join(" "),
                onClick: a.onClick,
                type: "button",
              },
              a.label
            )
          )
        )
      );

    const renderOverlayLayer = () => {
      if (state.ui.travelOpen) {
        return h(DF.TravelOverlay, {
          currentNode: state.run.nodeWeb?.nodes?.find?.((n) => n.id === state.run.currentNodeId),
          options: (state.run.nodeWeb?.nodes || []).filter((n) => travelOptions.includes(n.id)),
          allNodes: state.run.nodeWeb?.nodes || [],
          selectedId: state.ui.selectedNode,
          onSelect: (id) => DF.director.act("TRAVEL_SELECT", { nodeId: id }),
          onConfirm: (id) => DF.director.act("TRAVEL_CONFIRM", { nodeId: id }),
          onClose: () => DF.director.act("TRAVEL_CLOSE"),
        });
      }
      if (state.ui.scenePayload?.travelText && state.ui.sceneWipe?.active) {
        return h(
          "div",
          { className: "df-overlay-card" },
          h("div", { className: "df-overlay-card__title" }, state.ui.scenePayload.travelText)
        );
      }
      return null;
    };

    const overlayLayer = renderOverlayLayer();
    const isModalOverlayActive = Boolean(overlayLayer);

    const actionButtons = DF.director.getActions(state);

    const worldLayer = (() => {
      if (scene === DF.SCENES.TITLE || scene === DF.SCENES.GAMEOVER) {
        const imgKey = scene === DF.SCENES.GAMEOVER ? "ui_gameover" : "ui_title";
        const imgSrc = imageSrcFor(imgKey);
        const titleCard =
          scene === DF.SCENES.TITLE
            ? h(
                "div",
                { className: "df-title-card" },
                h("div", { className: "df-title-card__eyebrow" }, "Beacon Preview"),
                h("div", { className: "df-title-card__title" }, "Dragonfall"),
                h("div", { className: "df-title-card__subtitle" }, "Light the beacon. Brave the mountain."),
                h(
                  "div",
                  { className: "df-title-card__actions" },
                  h(
                    "button",
                    { className: "df-title-card__btn", onClick: () => DF.director.act("START_RUN"), type: "button" },
                    "Start Run"
                  )
                )
              )
            : overlayCard("Run Ended", [
                { key: "retry", label: "Retry", primary: true, onClick: () => DF.director.act("RUN_RETRY") },
                { key: "quit", label: "Quit to Prep", onClick: () => DF.director.act("RUN_QUIT") },
              ]);
        return h(
          "div",
          {
            className: "df-title-screen",
            style: imgSrc
              ? {
                  backgroundImage: `url(${imgSrc})`,
                }
              : undefined,
          },
          h("div", { className: "df-title-screen__content" }, titleCard),
          !imgSrc
            ? h(
                "div",
                { className: "df-title-screen__fallback" },
                scene === DF.SCENES.GAMEOVER ? "Beacon offline" : "TITLE OK • Background missing"
              )
            : null
        );
      }
      if (scene === DF.SCENES.PREP) {
        return h(DF.PrepScreen, { state });
      }
      return worldCard;
    })();

    const header = h(
      "div",
      { className: "df-frame__top" },
      h(
        "div",
        { className: "df-frame__title" },
        h("div", { className: "df-frame__title-main" }, "Dragonfall"),
        h("div", { className: "df-frame__title-sub" }, `${subtitle} • v${DF.VERSION}`)
      ),
      h("div", { className: "df-frame__hud" }, ...hudPills)
    );

    const dialogLayerForScene =
      scene === DF.SCENES.TITLE
        ? h(
            "div",
            { className: "df-playwindow__dialog-shell" },
            h(DF.EventLog, {
              log: [
                {
                  id: "title-start",
                  type: "prompt",
                  promptKey: "title-start",
                  text: "Press Start to enter the Beacon.",
                  choices: [{ id: "start", label: "Start Run", primary: true }],
                  t: Date.now(),
                  resolved: false,
                },
              ],
              onPromptChoice: (_, choice) => {
                if (!choice) return;
                DF.director.act("START_RUN");
              },
            })
          )
        : scene === DF.SCENES.GAMEOVER
        ? h(
            "div",
            { className: "df-playwindow__dialog-shell" },
            h("div", { className: "df-log-line df-log-line--system", "data-ts": Date.now() }, "Run failed. Try again?")
          )
        : dialogLayer;

    return h(
      ErrorBoundary,
      null,
      h(
        "div",
        { className: "df-client-stage df-ui" },
        h("div", { className: "df-client-stage__grain" }),
        h(
          "div",
          { className: "df-client-stage__frame" },
          header,
          h(DF.PlayWindow, {
            key: scene,
            worldLayer,
            overlayLayer,
            dialogLayer: isModalOverlayActive ? null : dialogLayerForScene,
            actionLayer: isModalOverlayActive ? null : h(DF.ActionBar, { actions: actionButtons }),
            sceneWipe: state.ui.sceneWipe,
          }),
          h(DF.PromotionModal, {
            state,
            onLater: () => DF.director.act("PROMOTION_LATER"),
            onChooseElement: (key) => DF.director.act("PROMOTION_ELEMENT", { key }),
            onChooseCross: (key) => DF.director.act("PROMOTION_CROSS", { key }),
          }),
          h(DF.Toast, { toast })
        )
      )
    );
  };
})();
