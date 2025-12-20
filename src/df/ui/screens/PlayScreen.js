// src/df/ui/screens/PlayScreen.js
(function () {
  const DF = window.DF;
  if (!DF) throw new Error("DF namespace missing in PlayScreen.js");

  // -----------------------------
  // Utilities / Adapters
  // -----------------------------
  const log = (msg) => {
    try {
      if (DF.state && DF.state.log && typeof DF.state.log.push === "function") {
        DF.state.log.push(msg);
        return;
      }
    } catch (_) {}
    // Fallback: quiet console log (keeps “game in browser” feel but doesn’t crash)
    console.log("[DF]", msg);
  };

  const d20 = () => {
    // Prefer DF dice if you have it; fallback to Math.random.
    try {
      if (DF.logic && DF.logic.dice && typeof DF.logic.dice.d20 === "function") {
        return DF.logic.dice.d20();
      }
      if (DF.logic && DF.logic.dice && typeof DF.logic.dice.roll === "function") {
        return DF.logic.dice.roll(20);
      }
    } catch (_) {}
    return 1 + Math.floor(Math.random() * 20);
  };

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const getSiteById = (siteId) => {
    try {
      if (DF.data && DF.data.sites && typeof DF.data.sites.get === "function") {
        return DF.data.sites.get(siteId);
      }
      if (DF.data && DF.data.sites && DF.data.sites[siteId]) return DF.data.sites[siteId];
    } catch (_) {}
    return { id: siteId, name: siteId, danger: 1, biome: "wilds" };
  };

  // Very small event system (you can replace later with DF.data.events)
  const rollExplorationOutcome = (site) => {
    // Use site.danger to bias into combat.
    const danger = clamp(Number(site.danger || 1), 1, 10);

    // Basic weights: as danger rises, combat becomes more likely.
    // Nothing is intentionally allowed (roguelite pacing).
    const wCombat = 30 + danger * 5;  // 35..80
    const wEvent = 45 - danger * 2;   // 43..25
    const wNothing = 25 - danger * 1; // 24..15
    const total = Math.max(1, wCombat + wEvent + wNothing);

    const r = Math.floor(Math.random() * total) + 1;
    if (r <= wCombat) return { type: "combat" };
    if (r <= wCombat + wEvent) return { type: "event" };
    return { type: "nothing" };
  };

  const generateEvent = (site) => {
    // Minimal “v0.5” events: clean, lethal-optional, and loot hooks.
    const options = [
      {
        id: "shrine",
        title: "Weathered Shrine",
        body: "A cracked shrine hums faintly. Something listens.",
        choices: [
          { id: "pray", label: "Pray (WIS check)", kind: "check", stat: "wis", dr: 12 },
          { id: "loot", label: "Pry loose an offering (DEX check)", kind: "check", stat: "dex", dr: 12 },
          { id: "leave", label: "Leave", kind: "leave" },
        ],
      },
      {
        id: "tracks",
        title: "Fresh Tracks",
        body: "Tracks cut through the dust—recent, heavy, confident.",
        choices: [
          { id: "follow", label: "Follow (forced combat)", kind: "forcedCombat" },
          { id: "avoid", label: "Avoid (DEX check)", kind: "check", stat: "dex", dr: 11 },
        ],
      },
      {
        id: "cache",
        title: "Buried Cache",
        body: "A loose stone reveals a wrapped bundle.",
        choices: [
          { id: "open", label: "Open it", kind: "loot" },
          { id: "ignore", label: "Ignore it", kind: "leave" },
        ],
      },
    ];

    // Tiny bias by biome later; for now random:
    return options[Math.floor(Math.random() * options.length)];
  };

  // Combat adapter:
  const combatAPI = () => (DF.logic && DF.logic.combat) ? DF.logic.combat : null;

  const startCombat = (state, enemyHint) => {
    const site = getSiteById(state.siteId);
    const Combat = combatAPI();

    if (Combat && typeof Combat.createEncounter === "function") {
      const encounter = Combat.createEncounter({
        siteId: state.siteId,
        enemyHint: enemyHint || null,
        player: state.player,
      });

      log(`⚔️ Combat begins at ${site.name}.`);
      return {
        ...state,
        mode: "COMBAT",
        combat: {
          engine: "DF",
          encounter,
        },
      };
    }

    // Placeholder combat (keeps project playable while combat.js evolves)
    const enemy = {
      name: enemyHint || "Mountain Wretch",
      hp: 6 + Math.floor(Math.random() * 7),
      dr: 11 + Math.floor(Math.random() * 3),
      dmg: 2 + Math.floor(Math.random() * 3),
    };

    log(`⚔️ Combat begins at ${site.name}: ${enemy.name} appears.`);
    return {
      ...state,
      mode: "COMBAT",
      combat: {
        engine: "MIN",
        enemy,
        turn: "player",
        last: null,
      },
    };
  };

  const stepCombat = (state) => {
    if (!state.combat) return state;
    const Combat = combatAPI();

    // Engine-backed combat
    if (state.combat.engine === "DF" && Combat) {
      const enc = state.combat.encounter;

      try {
        if (typeof Combat.step === "function") {
          const out = Combat.step(enc, { player: state.player });
          if (out && out.log) {
            (Array.isArray(out.log) ? out.log : [out.log]).forEach((l) => log(l));
          }

          const nextPlayer = out && out.player ? out.player : state.player;
          const over = !!(out && out.isOver);
          const won = !!(out && out.won);

          let next = { ...state, player: nextPlayer, combat: { ...state.combat, encounter: out.encounter || enc } };

          if (next.player.hp <= 0) return killPlayer(next, "You fall in combat.");

          if (over) {
            if (won) {
              log("✅ Victory.");
              next = rewardAfterCombat(next);
              return { ...next, mode: "PLAY", combat: null };
            } else {
              return killPlayer(next, "Defeat.");
            }
          }
          return next;
        }
      } catch (e) {
        console.warn("Combat.step failed, falling back:", e);
      }
    }

    // Minimal combat
    const enemy = state.combat.enemy;
    if (!enemy) return { ...state, mode: "PLAY", combat: null };

    if (state.combat.turn === "player") {
      const roll = d20();
      const hit = roll >= enemy.dr;
      let enemyHp = enemy.hp;
      let last = { who: "player", roll, hit };

      if (hit) {
        const dmg = 1 + Math.floor(Math.random() * 6);
        enemyHp = enemyHp - dmg;
        last.dmg = dmg;
        log(`🗡️ You strike (${roll}) for ${dmg}.`);
      } else {
        log(`🛡️ You miss (${roll}).`);
      }

      if (enemyHp <= 0) {
        log("✅ Victory.");
        const next = rewardAfterCombat(state);
        return { ...next, mode: "PLAY", combat: null };
      }

      return {
        ...state,
        combat: {
          ...state.combat,
          enemy: { ...enemy, hp: enemyHp },
          turn: "enemy",
          last,
        },
      };
    }

    // Enemy turn
    const roll = d20();
    const hit = roll >= (10 + Math.floor(state.player.level / 2)); // crude evasion DR for now
    let playerHp = state.player.hp;
    if (hit) {
      playerHp -= enemy.dmg;
      log(`💥 ${enemy.name} hits (${roll}) for ${enemy.dmg}.`);
    } else {
      log(`✨ ${enemy.name} misses (${roll}).`);
    }

    const next = { ...state, player: { ...state.player, hp: playerHp }, combat: { ...state.combat, turn: "player" } };
    if (next.player.hp <= 0) return killPlayer(next, "You fall in combat.");
    return next;
  };

  const rewardAfterCombat = (state) => {
    const loot = { kind: "essence", amount: 1 };
    log("🜂 You harvest essence.");
    const runLoot = state.runLoot.concat([loot]);
    const xpGain = 1;
    const xp = state.player.xp + xpGain;

    const nextLevel = 1 + Math.floor(xp / 5);

    return {
      ...state,
      runLoot,
      player: { ...state.player, xp, level: Math.max(state.player.level, nextLevel) },
    };
  };

  const killPlayer = (state, reason) => {
    log(`☠️ ${reason}`);
    return { ...state, mode: "DEAD", deathReason: reason };
  };

  const tryBuildBeacon = (state) => {
    const essence = state.runLoot.filter((x) => x.kind === "essence").length;
    if (essence < 3) {
      log("⛓️ Not enough essence to build a beacon (need 3).");
      return state;
    }
    log("🜁 Beacon raised. The mountain remembers you.");
    return {
      ...state,
      mode: "PLAY",
      beacons: state.beacons.concat([{ siteId: state.siteId, createdAt: Date.now() }]),
      runLoot: state.runLoot.filter((x, i) => !(x.kind === "essence" && i < 3)),
    };
  };

  // -----------------------------
  // State Machine (Reducer)
  // -----------------------------
  const initialMachineState = (game) => {
    const g = game || {};
    const siteId = g.siteId || "start";
    const player =
      g.player || { hp: 12, maxHp: 12, xp: 0, level: 1, weapon: "Sword", style: "Vagrant" };

    return {
      mode: g.mode || "PLAY",
      siteId,
      player,
      runLoot: g.runLoot || [],
      beacons: g.beacons || [],
      event: g.event || null,
      combat: g.combat || null,
      deathReason: g.deathReason || null,
      rollingLabel: null,
    };
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case "SYNC_FROM_PARENT": {
        return initialMachineState(action.game);
      }

      case "PLAY_EXPLORE": {
        const site = getSiteById(state.siteId);
        log(`🧭 You explore ${site.name}...`);
        return { ...state, mode: "ROLLING", rollingLabel: "Exploring..." };
      }

      case "PLAY_STIR": {
        const site = getSiteById(state.siteId);
        log(`🔥 You stir trouble at ${site.name}.`);
        return startCombat({ ...state, mode: "COMBAT" }, null);
      }

      case "PLAY_REST": {
        const heal = 2 + Math.floor(Math.random() * 3);
        const nextHp = clamp(state.player.hp + heal, 0, state.player.maxHp);
        log(`🛏️ You rest and recover ${nextHp - state.player.hp} HP.`);
        const ambushRoll = d20();
        if (ambushRoll >= 19) {
          log("⚠️ Ambush during rest!");
          return startCombat({ ...state, player: { ...state.player, hp: nextHp } }, "Ambusher");
        }
        return { ...state, player: { ...state.player, hp: nextHp } };
      }

      case "PLAY_EXTRACT": {
        const count = state.runLoot.length;
        log(`🚪 You extract with ${count} loot.`);
        return { ...state, runLoot: [], mode: "PLAY" };
      }

      case "PLAY_BUILD_BEACON": {
        return tryBuildBeacon(state);
      }

      case "ROLL_RESOLVE": {
        const site = getSiteById(state.siteId);
        const outcome = rollExplorationOutcome(site);

        if (outcome.type === "combat") {
          log("⚔️ Something finds you.");
          return startCombat({ ...state, mode: "COMBAT", rollingLabel: null }, null);
        }

        if (outcome.type === "event") {
          const ev = generateEvent(site);
          log(`📜 Event: ${ev.title}`);
          return { ...state, mode: "EVENT", event: ev, rollingLabel: null };
        }

        log("…Nothing. The mountain stays silent.");
        return { ...state, mode: "PLAY", rollingLabel: null };
      }

      case "EVENT_CHOICE": {
        if (!state.event) return { ...state, mode: "PLAY" };

        const ev = state.event;
        const choice = (ev.choices || []).find((c) => c.id === action.choiceId);
        if (!choice) return state;

        if (choice.kind === "leave") {
          log("You move on.");
          return { ...state, mode: "PLAY", event: null };
        }

        if (choice.kind === "forcedCombat") {
          return startCombat({ ...state, event: null }, "Hunted Foe");
        }

        if (choice.kind === "loot") {
          log("🎁 You take what you can carry.");
          return {
            ...state,
            runLoot: state.runLoot.concat([{ kind: "essence", amount: 1 }]),
            mode: "PLAY",
            event: null,
          };
        }

        if (choice.kind === "check") {
          const roll = d20();
          const dr = choice.dr || 12;
          const pass = roll >= dr;

          if (pass) {
            log(`✅ Success (${roll} vs ${dr}).`);
            if (choice.id === "pray") {
              const heal = 3;
              const nextHp = clamp(state.player.hp + heal, 0, state.player.maxHp);
              log(`✨ Warmth returns. +${nextHp - state.player.hp} HP.`);
              return {
                ...state,
                player: { ...state.player, hp: nextHp },
                event: null,
                mode: "PLAY",
              };
            }
            log("🜂 You gain essence.");
            return {
              ...state,
              runLoot: state.runLoot.concat([{ kind: "essence", amount: 1 }]),
              event: null,
              mode: "PLAY",
            };
          }

          log(`❌ Fail (${roll} vs ${dr}).`);
          const bite = 2;
          const nextHp = state.player.hp - bite;
          log(`🩸 You pay for it. -${bite} HP.`);
          const next = { ...state, player: { ...state.player, hp: nextHp } };
          if (next.player.hp <= 0) return killPlayer(next, "You collapse after a mistake.");
          if (d20() >= 18) {
            log("⚠️ Your failure draws attention.");
            return startCombat({ ...next, event: null }, "Drawn Predator");
          }
          return { ...next, event: null, mode: "PLAY" };
        }

        return { ...state, event: null, mode: "PLAY" };
      }

      case "COMBAT_STEP": {
        const next = stepCombat(state);
        return next;
      }

      case "NEW_RUN": {
        log("🜃 A new run begins.");
        return initialMachineState(action.game || null);
      }

      default:
        return state;
    }
  };

  // -----------------------------
  // React UI
  // -----------------------------
  function PlayScreen(props) {
    const React = window.React;

    const [state, dispatch] = React.useReducer(
      reducer,
      initialMachineState(props.game)
    );

    // Optional: let parent sync with this sub-machine later
    React.useEffect(() => {
      if (typeof props.onGameChange === "function") {
        props.onGameChange({
          mode: state.mode,
          siteId: state.siteId,
          player: state.player,
          runLoot: state.runLoot,
          beacons: state.beacons,
          event: state.event,
          combat: state.combat,
          deathReason: state.deathReason,
        });
      }
    }, [state]);

    React.useEffect(() => {
      if (state.mode !== "ROLLING") return;
      const t = setTimeout(() => dispatch({ type: "ROLL_RESOLVE" }), 450);
      return () => clearTimeout(t);
    }, [state.mode]);

    const site = getSiteById(state.siteId);
    const WorldViewport = DF.WorldViewport;
    const worldLog = (props.state && props.state.run && Array.isArray(props.state.run.log))
      ? props.state.run.log
      : [];
    const latestStory = worldLog.find((l) => l && l.type === "story") || worldLog[0] || null;
    const worldMessage = (latestStory && latestStory.text) || "The mountain waits.";
    const WORLD_VIEWPORT_SCALE = 4;

    const Card = ({ title, children }) =>
      React.createElement(
        "div",
        { className: "rounded-xl border border-white/10 bg-black/40 p-3 shadow" },
        React.createElement("div", { className: "text-sm font-semibold opacity-90 mb-2" }, title),
        children
      );

    const Btn = ({ onClick, children, disabled }) =>
      React.createElement(
        "button",
        {
          onClick,
          disabled,
          className:
            "px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 disabled:opacity-40 disabled:hover:bg-white/5 text-sm",
        },
        children
      );

    // DEAD
    if (state.mode === "DEAD") {
      return React.createElement(
        "div",
        { className: "space-y-3" },
        React.createElement("div", { className: "text-xl font-bold" }, "You Died"),
        React.createElement("div", { className: "opacity-80 text-sm" }, state.deathReason || "The run ends."),
        React.createElement(
          "div",
          { className: "flex gap-2 flex-wrap" },
          Btn({
            onClick: () => dispatch({ type: "NEW_RUN" }),
            children: "Start New Run",
          })
        ),
        React.createElement(
          "div",
          { className: "opacity-70 text-xs" },
          "Death should feed meta-progression next (Beacon buffs, unlocks)."
        )
      );
    }

    // COMBAT
    if (state.mode === "COMBAT") {
      const enemyName =
        state.combat && state.combat.engine === "MIN" && state.combat.enemy
          ? state.combat.enemy.name
          : "Enemy";

      return React.createElement(
        "div",
        { className: "space-y-3" },
        React.createElement("div", { className: "text-lg font-bold" }, `Combat — ${enemyName}`),
        React.createElement(
          "div",
          { className: "grid grid-cols-2 gap-3" },
          React.createElement(
            Card,
            { title: "Player" },
            React.createElement(
              "div",
              { className: "text-sm opacity-90" },
              `HP: ${state.player.hp}/${state.player.maxHp}`
            ),
            React.createElement(
              "div",
              { className: "text-xs opacity-70" },
              `Lvl ${state.player.level} • XP ${state.player.xp}`
            )
          ),
          React.createElement(
            Card,
            { title: "Enemy" },
            state.combat && state.combat.engine === "MIN" && state.combat.enemy
              ? React.createElement(
                  React.Fragment,
                  null,
                  React.createElement(
                    "div",
                    { className: "text-sm opacity-90" },
                    `HP: ${state.combat.enemy.hp}`
                  ),
                  React.createElement(
                    "div",
                    { className: "text-xs opacity-70" },
                    `DR: ${state.combat.enemy.dr} • DMG: ${state.combat.enemy.dmg}`
                  )
                )
              : React.createElement(
                  "div",
                  { className: "text-sm opacity-80" },
                  "Engine combat running…"
                )
          )
        ),
        React.createElement(
          "div",
          { className: "flex gap-2 flex-wrap" },
          Btn({ onClick: () => dispatch({ type: "COMBAT_STEP" }), children: "Step (Roll)" }),
          Btn({
            onClick: () => log("⛔ Retreat not allowed yet."),
            children: "Retreat",
            disabled: true,
          })
        ),
        React.createElement(
          "div",
          { className: "text-xs opacity-70" },
          "Combat is intentionally lethal. Escape can be a future skill/loot effect."
        )
      );
    }

    // EVENT
    if (state.mode === "EVENT" && state.event) {
      const ev = state.event;
      return React.createElement(
        "div",
        { className: "space-y-3" },
        React.createElement("div", { className: "text-lg font-bold" }, ev.title),
        React.createElement("div", { className: "opacity-85 text-sm" }, ev.body),
        React.createElement(
          "div",
          { className: "flex gap-2 flex-wrap" },
          (ev.choices || []).map((c) =>
            React.createElement(Btn, {
              key: c.id,
              onClick: () => dispatch({ type: "EVENT_CHOICE", choiceId: c.id }),
              children: c.label,
            })
          )
        )
      );
    }

    // ROLLING
    if (state.mode === "ROLLING") {
      return React.createElement(
        "div",
        { className: "space-y-3" },
        React.createElement("div", { className: "text-lg font-bold" }, site.name),
        React.createElement(
          "div",
          { className: "opacity-80 text-sm" },
          state.rollingLabel || "Rolling…"
        ),
        React.createElement(
          "div",
          { className: "text-xs opacity-60" },
          "The mountain decides."
        )
      );
    }

    // PLAY (default)
    return React.createElement(
      "div",
      { className: "space-y-3" },
      React.createElement(
        "div",
        { className: "flex items-baseline justify-between" },
        React.createElement("div", { className: "text-lg font-bold" }, site.name),
        React.createElement(
          "div",
          { className: "text-xs opacity-70" },
          `Danger ${site.danger || 1}`
        )
      ),

      React.createElement(
        "div",
        { className: "df-world-panel" },
        React.createElement("div", { className: "df-world-panel__title" }, "Field View"),
        WorldViewport
          ? React.createElement(WorldViewport, { scale: WORLD_VIEWPORT_SCALE })
          : React.createElement("div", { className: "text-sm opacity-70" }, "Loading viewport…"),
        React.createElement(
          "div",
          { className: "df-world-message" },
          React.createElement("div", { className: "df-world-message__text" }, worldMessage),
          React.createElement("div", { className: "df-world-message__hint" }, "Press [Enter] / [Space]")
        )
      ),

      React.createElement(
        "div",
        { className: "grid grid-cols-2 gap-3" },
        React.createElement(
          Card,
          { title: "Status" },
          React.createElement(
            "div",
            { className: "text-sm opacity-90" },
            `HP: ${state.player.hp}/${state.player.maxHp}`
          ),
          React.createElement(
            "div",
            { className: "text-xs opacity-70" },
            `Lvl ${state.player.level} • XP ${state.player.xp}`
          ),
          React.createElement(
            "div",
            { className: "text-xs opacity-70" },
            `Weapon: ${state.player.weapon} • Style: ${state.player.style}`
          )
        ),
        React.createElement(
          Card,
          { title: "Run Loot" },
          React.createElement(
            "div",
            { className: "text-sm opacity-90" },
            `${state.runLoot.length} item(s)`
          ),
          React.createElement(
            "div",
            { className: "text-xs opacity-70" },
            "Loot persists only if extracted / beaconed (later)."
          )
        )
      ),

      React.createElement(
        "div",
        { className: "flex gap-2 flex-wrap" },
        React.createElement(Btn, {
          onClick: () => dispatch({ type: "PLAY_EXPLORE" }),
          children: "Explore",
        }),
        React.createElement(Btn, {
          onClick: () => dispatch({ type: "PLAY_STIR" }),
          children: "Stir Trouble",
        }),
        React.createElement(Btn, {
          onClick: () => dispatch({ type: "PLAY_REST" }),
          children: "Rest",
        }),
        React.createElement(Btn, {
          onClick: () => dispatch({ type: "PLAY_EXTRACT" }),
          children: "Extract",
        }),
        React.createElement(Btn, {
          onClick: () => dispatch({ type: "PLAY_BUILD_BEACON" }),
          children: "Build Beacon",
        })
      ),

      React.createElement(
        "div",
        { className: "text-xs opacity-60" },
        "This screen is now a real state machine: PLAY → (ROLLING → EVENT/COMBAT/Nothing) → PLAY, with DEATH as a terminal state."
      )
    );
  }

  // -----------------------------
  // Attach into DF namespace
  // -----------------------------
  DF.PlayScreen = PlayScreen;          // <-- key fix for your blank screen
  DF.ui = DF.ui || {};
  DF.ui.screens = DF.ui.screens || {};
  DF.ui.screens.PlayScreen = PlayScreen;
})();
