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
    const defaultScreen = DF.UI_SCREENS?.TITLE || "TITLE";
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

    const screenFromScene = React.useCallback((sceneToMap) => {
      const map = DF.UI_SCREENS || {};
      if (sceneToMap === DF.SCENES?.PREP) return map.PREP || "PREP";
      if (sceneToMap === DF.SCENES?.PLAY) return map.RUN || "RUN";
      if (sceneToMap === DF.SCENES?.GAMEOVER) return map.RESULTS || "RESULTS";
      return map.TITLE || "TITLE";
    }, []);

    const screen = state.ui.screen || screenFromScene(scene) || defaultScreen;

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
    }, [imageFor, warnMissingAsset, screen]);

    const imageSrcFor = React.useCallback((key) => imageFor(key)?.src || null, [imageFor]);

    const travelOptions = useMemo(
      () => DF.director?.getTravelOptions?.(state) || [],
      [state, state.run?.nodeWeb, state.run?.currentNodeId, state.ui?.selectedNode]
    );

    const modeLabel = (() => {
      if (scene === DF.SCENES.TITLE) return "Title";
      if (scene === DF.SCENES.GAMEOVER) return "Run Ended";
      if (state.phase !== "play") return "Preparation";
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

    const latestStory =
      (state.run.log?.find((l) => l.type === "story") || state.run.log?.[state.run.log.length - 1] || {})?.text ||
      "The mountain waits.";

    const worldLayer = h(
      "div",
      { className: "df-run-viewport" },
      h(
        "div",
        { className: "df-run-viewport__viewport" },
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
        { className: "df-run-viewport__hint" },
        h("div", { className: "df-run-viewport__hint-main" }, latestStory),
        h("div", { className: "df-run-viewport__hint-sub" }, modeLabel)
      )
    );

    const overlayLayer = (() => {
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
    })();

    const isModalOverlayActive = Boolean(overlayLayer);
    const actionButtons = DF.director.getActions(state);

    // Screen flow: TITLE -> PREP -> RUN -> RESULTS. Legacy PrepScreen + EventLog live in screens2 wrappers.
    const screens = {
      [DF.UI_SCREENS?.TITLE || "TITLE"]: () =>
        h(DF.Screens2.TitleScreen, {
          imageSrc: imageSrcFor("ui_title"),
          onStart: () => DF.director.act("START_RUN"),
        }),
      [DF.UI_SCREENS?.PREP || "PREP"]: () =>
        h(DF.Screens2.PrepScreen, {
          state,
          onPromptChoice: (promptId, choice) => DF.director.act("PROMPT_CHOICE", { promptId, choice }),
        }),
      [DF.UI_SCREENS?.RUN || "RUN"]: () =>
        h(DF.Screens2.RunScreen, {
          state,
          hudPills,
          modeLabel,
          worldLayer,
          overlayLayer,
          log: chatLog,
          onPromptChoice: (promptId, choice) => DF.director.act("PROMPT_CHOICE", { promptId, choice }),
          actionButtons,
          sceneWipe: state.ui.sceneWipe,
          isOverlayActive: isModalOverlayActive,
        }),
      [DF.UI_SCREENS?.RESULTS || "RESULTS"]: () =>
        h(DF.Screens2.ResultsScreen, {
          imageSrc: imageSrcFor("ui_gameover"),
          onRetry: () => DF.director.act("RUN_RETRY"),
          onQuit: () => DF.director.act("RUN_QUIT"),
        }),
    };

    return h(
      ErrorBoundary,
      null,
      h(
        "div",
        { className: "df-client-stage df-ui" },
        h("div", { className: "df-client-stage__grain" }),
        h("div", { className: "df-client-stage__vignette" }),
        h(
          "div",
          { className: "df-client-stage__frame" },
          h(DF.Screens2.ScreenRouter, {
            screen,
            screens,
            transitionMs: 240,
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
