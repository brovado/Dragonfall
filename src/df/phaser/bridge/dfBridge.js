(() => {
  const DF = window.DF;
  if (!DF) return;

  const listeners = new Set();
  const internalState = {
    player: { x: 400, y: 225, hp: 10, maxHp: 10 },
    run: { roomId: "combat-room" },
    meta: { gold: 0 },
  };

  const mergeState = (base = {}) => {
    const dfState = DF.state || {};
    return {
      ...internalState,
      ...dfState,
      ...base,
      player: {
        ...internalState.player,
        ...(dfState.player || {}),
        ...(base.player || {}),
      },
      run: {
        ...internalState.run,
        ...(dfState.run || {}),
        ...(base.run || {}),
      },
      meta: {
        ...internalState.meta,
        ...(dfState.meta || {}),
        ...(base.meta || {}),
      },
    };
  };

  let currentState = mergeState();

  const notify = () => {
    const snapshot = bridge.getState();
    listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.warn("DF bridge listener error", err);
      }
    });
  };

  const applyUpdate = (partial) => {
    currentState = mergeState(partial);
    internalState.player = { ...internalState.player, ...currentState.player };
    internalState.run = { ...internalState.run, ...currentState.run };
    internalState.meta = { ...internalState.meta, ...currentState.meta };
  };

  const reduce = (action = {}) => {
    switch (action.type) {
      case "PLAYER_POSITION":
        applyUpdate({ player: { x: action.x ?? internalState.player.x, y: action.y ?? internalState.player.y } });
        return true;
      case "PLAYER_DAMAGE": {
        const nextHp = Math.max(0, (internalState.player.hp || 0) - (action.amount || 0));
        applyUpdate({ player: { hp: nextHp } });
        return true;
      }
      case "PLAYER_HEAL": {
        const maxHp = internalState.player.maxHp || 0;
        const nextHp = Math.min(maxHp, (internalState.player.hp || 0) + (action.amount || 0));
        applyUpdate({ player: { hp: nextHp } });
        return true;
      }
      case "GOLD_ADD": {
        const nextGold = (internalState.meta.gold || 0) + (action.amount || 0);
        applyUpdate({ meta: { gold: nextGold } });
        return true;
      }
      case "ROOM_SET":
        applyUpdate({ run: { roomId: action.roomId || internalState.run.roomId } });
        return true;
      default:
        return false;
    }
  };

  const bridge = {
    getState: () => mergeState(),
    dispatch: (action = {}) => {
      const updated = reduce(action);
      if (action?.passThrough && typeof DF.director?.act === "function") {
        try {
          DF.director.act(action.type, action.payload || action);
        } catch (err) {
          console.warn("DF bridge director passthrough failed", err);
        }
      }
      if (updated) notify();
    },
    subscribe: (fn) => {
      if (typeof fn !== "function") return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };

  DF.bridge = bridge;
})();
