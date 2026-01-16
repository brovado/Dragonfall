// src/df/game/director.js
(() => {
  const DF = window.DF;
  if (!DF) return;

  const ctx = {
    getState: null,
    updateState: null,
  };

  const ensureState = (draft) => {
    if (!draft.run) draft.run = { status: "exploring", log: [] };
    if (!draft.run.status) draft.run.status = "exploring";
    if (!draft.ui) draft.ui = {};
    if (typeof draft.ui.promptedWeapon !== "boolean") draft.ui.promptedWeapon = false;
    if (typeof draft.ui.promptedStyle !== "boolean") draft.ui.promptedStyle = false;
    if (!draft.ui.scene) draft.ui.scene = DF.SCENES?.TITLE || "TITLE";
    if (!draft.ui.screen) {
      const map = DF.UI_SCREENS || {};
      draft.ui.screen =
        draft.ui.scene === DF.SCENES?.PLAY
          ? map.RUN || "RUN"
          : draft.ui.scene === DF.SCENES?.PREP
          ? map.PREP || "PREP"
          : draft.ui.scene === DF.SCENES?.GAMEOVER
          ? map.RESULTS || "RESULTS"
          : map.TITLE || "TITLE";
    }
    if (typeof draft.ui.scenePayload === "undefined") draft.ui.scenePayload = null;
    if (!draft.ui.sceneWipe) draft.ui.sceneWipe = { active: false, mode: "idle", token: null };
    if (typeof draft.ui.travelOpen !== "boolean") draft.ui.travelOpen = false;
    if (typeof draft.ui.menuOpen !== "boolean") draft.ui.menuOpen = false;
    if (typeof draft.ui.selectedNode === "undefined") draft.ui.selectedNode = null;
    return draft;
  };

  const mutate = (fn) => {
    if (typeof ctx.updateState !== "function") return;
    ctx.updateState((prev) => {
      const draft = ensureState(structuredClone(prev));
      fn(draft);
      return draft;
    });
  };

  const recalcPlayer = (d) => {
    const w = DF.WEAPONS.find((x) => x.key === d.player.weapon);
    const bias = w?.bias || { might: 0, finesse: 0, wits: 0, will: 0 };
    d.player.stats = DF.computeStats(d.player.baseStats, bias, d.player.style, d.player.element, d.player.crossStyle);
    const hpBase = 10 + (d.meta.legacy.startHP || 0);
    d.player.hpMax = hpBase;
    d.player.hp = DF.clamp(d.player.hp, 0, hpBase);
    d.player.title = DF.titleFromBuild(d.player.weapon, d.player.style, d.player.element, d.player.crossStyle);
  };

  const resolvePromptEntry = (draft, promptId, choiceId) => {
    const entry = draft.run?.log?.find?.((l) => l.id === promptId);
    if (entry) {
      entry.resolved = true;
      entry.resolvedChoice = choiceId;
    }
  };

  const pushPrompt = (draft, promptKey, text, choices = []) => {
    const hasActive = draft.run?.log?.some?.((l) => l.type === "prompt" && l.promptKey === promptKey && !l.resolved);
    if (hasActive) return;
    DF.pushLog(draft, {
      type: "prompt",
      promptKey,
      text,
      choices: choices.map((c) => ({ ...c, id: c.id || c.value || c.label })),
      resolved: false,
    });
  };

  const primePrepPrompts = (draft) => {
    if (draft.phase === "start" && !draft.ui.promptedWeapon) {
      pushPrompt(
        draft,
        "start-weapon",
        "Choose your starting weapon.",
        DF.WEAPONS.map((w) => ({ id: w.key, label: w.name, sub: w.tagline, value: w.key }))
      );
      draft.ui.promptedWeapon = true;
    }
    if (draft.phase === "chooseStyle" && !draft.ui.promptedStyle && draft.player.weapon) {
      const weapon = DF.WEAPONS.find((w) => w.key === draft.player.weapon);
      if (weapon) {
        pushPrompt(
          draft,
          "start-style",
          `Choose a ${weapon.name} style.`,
          weapon.styles.map((s) => ({ id: s.key, label: s.name, sub: s.desc, value: s.key }))
        );
        draft.ui.promptedStyle = true;
      }
    }
  };

  const appendIntroLog = (draft) => {
    if (draft.run?.log?.length) return;
    DF.pushLog(draft, {
      type: "story",
      text: "Dragons rule the skies. Cities survive as beacons. The Mountain Expanse pays in blood and salvage.",
    });
    DF.pushLog(draft, { type: "story", text: "Promotions require XP. Only extracted goods endure." });
  };

  const setStatus = (draft, status) => {
    if (!draft.run) return;
    draft.run.status = status;
  };

  const travelOptions = (state) => {
    const web = state.run?.nodeWeb;
    const cur = state.run?.currentNodeId;
    if (!web || !cur) return [];
    const out = new Set();
    for (const e of web.edges || []) {
      if (e.a === cur) out.add(e.b);
      if (e.b === cur) out.add(e.a);
    }
    return Array.from(out);
  };

  const safeGetTravelOptions = (state = {}) => {
    try {
      if (DF.map?.getTravelOptions) {
        const opts = DF.map.getTravelOptions(state);
        if (Array.isArray(opts)) return opts;
      }
      if (typeof DF.getTravelOptions === "function") {
        const opts = DF.getTravelOptions(state);
        if (Array.isArray(opts)) return opts;
      }
    } catch (err) {
      console.warn("DF.director travel options error", err);
    }
    return travelOptions(state);
  };

  const screenFromScene = (scene) => {
    const map = DF.UI_SCREENS || {};
    if (scene === DF.SCENES?.PREP) return map.PREP || "PREP";
    if (scene === DF.SCENES?.PLAY) return map.RUN || "RUN";
    if (scene === DF.SCENES?.GAMEOVER) return map.RESULTS || "RESULTS";
    return map.TITLE || "TITLE";
  };

  const triggerScene = ({ scene, payload = null, onMid, duration = 240 }) => {
    const token = DF.uid();
    mutate((draft) => {
      draft.ui.sceneWipe = { active: true, mode: "out", token };
      if (payload !== null) draft.ui.scenePayload = payload;
    });
    window.setTimeout(() => {
      mutate((draft) => {
        if (typeof onMid === "function") onMid(draft);
        if (scene) draft.ui.scene = scene;
        if (scene) draft.ui.screen = screenFromScene(scene);
        draft.ui.scenePayload = payload ?? draft.ui.scenePayload ?? null;
        draft.ui.sceneWipe = { active: true, mode: "in", token };
      });
    }, duration);
    window.setTimeout(() => {
      mutate((draft) => {
        if (draft.ui.sceneWipe?.token === token) draft.ui.sceneWipe = { active: false, mode: "idle", token: null };
      });
    }, duration * 2);
  };

  const applyWeaponChoice = (draft, weaponKey, promptId) => {
    if (!weaponKey) return;
    draft.player.weapon = weaponKey;
    recalcPlayer(draft);
    draft.phase = "chooseStyle";
    draft.ui.promptedStyle = false;
    resolvePromptEntry(draft, promptId, weaponKey);
    DF.pushLog(draft, { type: "system", text: `Armament chosen: ${weaponKey.toUpperCase()}.` });
    primePrepPrompts(draft);
  };

  const applyStyleChoice = (draft, styleKey, promptId) => {
    if (!styleKey) return;
    draft.player.style = styleKey;
    recalcPlayer(draft);
    draft.phase = "play";
    draft.run.depth = 1;
    const rng = DF.mulberry32(draft.rngSeed ^ 0xabc);
    draft.run.nodeWeb = DF.createNodeWeb(rng);
    draft.run.currentNodeId = "n0";
    const start = draft.run.nodeWeb.nodes.find((n) => n.id === "n0");
    draft.run.site = start?.site || DF.pickSite(rng);
    draft.run.danger = "unknown";
    setStatus(draft, "exploring");
    resolvePromptEntry(draft, promptId, styleKey);
    DF.pushLog(draft, { type: "system", text: `Style chosen: ${styleKey.toUpperCase()}.` });
    DF.pushLog(draft, {
      type: "story",
      text: "You are torn into light. Then—cold stone, thin air, and the smell of ash.",
    });
  };

  const moveToNode = (draft, id) => {
    const web = draft.run.nodeWeb;
    if (!web) return;
    const cur = draft.run.currentNodeId;
    if (cur === id) {
      setStatus(draft, "exploring");
      return;
    }
    const adjacent = web.edges.some((e) => (e.a === cur && e.b === id) || (e.b === cur && e.a === id));
    if (!adjacent) {
      DF.pushLog(draft, { type: "system", text: "You cannot reach that node from here." });
      return;
    }
    draft.run.currentNodeId = id;
    draft.ui.selectedNode = id;
    const node = web.nodes.find((n) => n.id === id);
    if (node) {
      draft.run.site = node.site;
      draft.run.depth += 1;
      for (const e of web.edges) {
        if (e.a === id) {
          const nb = web.nodes.find((x) => x.id === e.b);
          if (nb) nb.revealed = true;
        }
        if (e.b === id) {
          const nb = web.nodes.find((x) => x.id === e.a);
          if (nb) nb.revealed = true;
        }
      }
      draft.run.danger = node.kind === "fight" ? "unknown" : "cleared";
      setStatus(draft, "exploring");
      DF.pushLog(draft, { type: "story", text: `You move to: ${node.site.name}.` });
      DF.pushLog(draft, { type: "story", text: node.site.tone });
      if (node.kind === "station") DF.pushLog(draft, { type: "system", text: "A dormant relay sits here. You may Extract." });
    }
  };

  const takeDamage = (draft, amount, reason) => {
    draft.player.hp = DF.clamp(draft.player.hp - amount, 0, draft.player.hpMax);
    DF.pushLog(draft, { type: "system", text: `You take ${amount} damage (${reason}).` });
    if (draft.player.hp <= 0) {
      draft.phase = "dead";
      const echoes = 2 + draft.run.depth + Math.floor(draft.player.gold / 3);
      draft.meta.echoes += echoes;
      DF.pushLog(draft, { type: "story", text: "☠️ You fall. The mountain keeps what you failed to extract." });
      DF.pushLog(draft, { type: "system", text: `You gain ${echoes} Echoes at the Beacon.` });
      triggerScene({ scene: DF.SCENES.GAMEOVER });
    }
  };

  const ensureEncounter = (draft) => {
    if (draft.run.inCombat) return;
    const rng = DF.mulberry32(draft.rngSeed ^ draft.run.depth ^ 0xdead);
    const enemy = DF.pickEnemy(rng);
    draft.run.inCombat = true;
    setStatus(draft, "in_combat");
    draft.run.enemy = { ...enemy };
    draft.run.enemyHP = enemy.hp;
    DF.pushLog(draft, { type: "story", text: `⚔️ ${enemy.name} appears. ${enemy.desc}` });
  };

  const enemyTurn = (draft, ctxLabel) => DF.resolveEnemyTurn(draft, takeDamage, ctxLabel);

  const endCombatWin = (draft) => {
    const rng = DF.mulberry32(draft.rngSeed ^ draft.run.depth ^ 0xbeef);
    const loot = draft.run.site?.loot ? draft.run.site.loot[Math.floor(rng() * draft.run.site.loot.length)] : "Scrap";
    draft.player.inventory.push(loot);
    draft.player.gold += 1 + Math.floor(rng() * 3);
    const xp = 2;
    draft.player.xp += xp;
    draft.run.inCombat = false;
    draft.run.enemy = null;
    draft.run.enemyHP = 0;
    draft.run.danger = "cleared";
    setStatus(draft, "exploring");
    const node = draft.run.nodeWeb?.nodes.find((n) => n.id === draft.run.currentNodeId);
    if (node) node.cleared = true;
    DF.pushLog(draft, { type: "system", text: `Victory. Loot gained: ${loot}. +${xp} XP.` });
    if (draft.player.promoTier === 0 && draft.player.xp >= draft.player.nextPromoAt) {
      draft.ui.showPromotion = true;
      DF.pushLog(draft, { type: "story", text: "Something in you shifts. A new discipline is ready to bind." });
    }
  };

  const combatAction = (key) =>
    mutate((draft) => {
      if (draft.phase !== "play" || !draft.run.inCombat || !draft.run.enemy) {
        DF.pushLog(draft, { type: "system", text: "No enemy to fight." });
        return;
      }
      setStatus(draft, "in_combat");
      const enemy = draft.run.enemy;
      const rng = DF.mulberry32(draft.rngSeed ^ draft.run.depth ^ 0x2222 ^ Date.now());
      const atk = DF.computeAttackMod(draft.player.stats, draft.player.weapon);
      const def = DF.computeDefenseMod(draft.player.stats, draft.player.style);
      const doAttack = (label, bonus, min, max, onMiss) => {
        const check = DF.rollCheck(rng, label, atk + bonus, enemy.dr);
        DF.pushLog(draft, {
          type: "roll",
          text: `${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${
            check.success ? "SUCCESS" : "FAIL"
          }`,
        });
        if (check.success) {
          let dmg = DF.rollDamage(rng, min, max);
          if (check.d20 === 20) {
            dmg += 1;
            if (draft.player.element === "fire") dmg += 1;
            DF.pushLog(draft, { type: "system", text: "Critical impact." });
          }
          draft.run.enemyHP = Math.max(0, draft.run.enemyHP - dmg);
          DF.pushLog(draft, { type: "system", text: `Enemy takes ${dmg} damage.` });
          if (draft.run.enemyHP <= 0) {
            endCombatWin(draft);
            return;
          }
        } else if (onMiss) onMiss();
        if (draft.phase !== "dead") enemyTurn(draft, "combat");
      };
      if (key === "attack") {
        doAttack("You attack", 0, 1, 3);
        return;
      }
      if (key === "defend") {
        draft.run._defendActive = true;
        DF.pushLog(draft, { type: "system", text: `You Brace (Defense mod ${DF.fmtBonus(def)}).` });
        enemyTurn(draft, "brace");
        return;
      }
      if (key === "maneuver") {
        const check = DF.rollCheck(rng, "You Maneuver", draft.player.stats.wits + draft.player.stats.finesse, DF.DR.standard);
        DF.pushLog(draft, {
          type: "roll",
          text: `${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${
            check.success ? "SUCCESS" : "FAIL"
          }`,
        });
        if (!check.success) takeDamage(draft, 1, "misstep");
        if (draft.phase !== "dead") enemyTurn(draft, "counter");
        return;
      }
      if (key === "aim") {
        DF.pushLog(draft, { type: "system", text: "You Aim (+2 baked into this shot)." });
        doAttack("Aimed Shot", 2, 1, 4);
        return;
      }
      if (key === "dash") {
        const check = DF.rollCheck(rng, "Dash Shot", atk + 1, enemy.dr);
        DF.pushLog(draft, {
          type: "roll",
          text: `${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${
            check.success ? "SUCCESS" : "FAIL"
          }`,
        });
        if (check.success) {
          const dmg = DF.rollDamage(rng, 1, 3);
          draft.run.enemyHP = Math.max(0, draft.run.enemyHP - dmg);
          DF.pushLog(draft, { type: "system", text: `Enemy takes ${dmg} damage.` });
          if (draft.run.enemyHP <= 0) {
            endCombatWin(draft);
            return;
          }
          DF.pushLog(draft, { type: "system", text: "You slip out of reach. No retaliation." });
          return;
        }
        enemyTurn(draft, "dash-fail");
        return;
      }
      if (key === "snare") {
        DF.pushLog(draft, { type: "system", text: "You set a Snare. Enemy Attack DR +2 once." });
        const old = enemy.attackDR;
        enemy.attackDR = old + 2;
        enemyTurn(draft, "snare");
        enemy.attackDR = old;
        return;
      }
      if (key === "bolt") {
        doAttack("Arc Bolt", 1, 1, 5);
        return;
      }
      if (key === "hex") {
        const old = enemy.dr;
        enemy.dr = Math.max(8, enemy.dr - 2);
        DF.pushLog(draft, { type: "system", text: "Hex: Enemy DR −2 this turn." });
        doAttack("Hexed Strike", 0, 1, 2);
        enemy.dr = old;
        return;
      }
      if (key === "focus") {
        DF.pushLog(draft, { type: "system", text: "You Focus (+2 baked into next cast)." });
        doAttack("Focused Cast", 2, 1, 4);
        return;
      }
      if (key === "riposte") {
        doAttack("Shield-Check", 0, 1, 2);
        return;
      }
      if (key === "bleed") {
        doAttack("Open Vein", 0, 2, 4, () => takeDamage(draft, 1, "overextension"));
        return;
      }
      if (key === "lunge") {
        doAttack("Lunge", 1, 2, 5, () => takeDamage(draft, 2, "exposed"));
      }
    });

  const rest = () =>
    mutate((draft) => {
      if (draft.phase !== "play" || draft.run.inCombat) {
        DF.pushLog(draft, { type: "system", text: "You cannot rest right now." });
        return;
      }
      setStatus(draft, "resting");
      const rng = DF.mulberry32(draft.rngSeed ^ draft.run.depth ^ 0x3333 ^ Date.now());
      const heal = 2;
      draft.player.hp = DF.clamp(draft.player.hp + heal, 0, draft.player.hpMax);
      DF.pushLog(draft, { type: "system", text: `You rest (+${heal} HP).` });
      if (rng() < 0.5) {
        ensureEncounter(draft);
        return;
      }
      DF.pushLog(draft, { type: "story", text: "The wind passes. No footsteps." });
      setStatus(draft, "exploring");
    });

  const travelSelect = (nodeId) =>
    mutate((draft) => {
      if (draft.phase !== "play") return;
      const reachable = safeGetTravelOptions(draft);
      if (!reachable.includes(nodeId)) {
        DF.pushLog(draft, { type: "system", text: "Choose a reachable destination." });
        return;
      }
      draft.ui.selectedNode = nodeId;
    });

  const travelOpen = () =>
    mutate((draft) => {
      if (draft.phase !== "play") return;
      if (draft.run.inCombat) {
        DF.pushLog(draft, { type: "system", text: "Resolve combat before traveling." });
        return;
      }
      draft.ui.travelOpen = true;
      const opts = safeGetTravelOptions(draft);
      draft.ui.selectedNode = draft.ui.selectedNode && opts.includes(draft.ui.selectedNode) ? draft.ui.selectedNode : opts[0] || null;
      setStatus(draft, "traveling");
    });

  const travelClose = () =>
    mutate((draft) => {
      draft.ui.travelOpen = false;
      if (draft.run.status === "traveling") setStatus(draft, "exploring");
    });

  const checkNode = () =>
    mutate((draft) => {
      if (draft.phase !== "play") return;
      if (draft.run.inCombat) return;
      const currentNode = draft.run.nodeWeb?.nodes?.find?.((n) => n.id === draft.run.currentNodeId);
      if (draft.run.danger === "unknown" && currentNode?.kind === "fight") ensureEncounter(draft);
    });

  const travelConfirm = (nodeId) => {
    const current = ctx.getState?.();
    if (current?.run?.inCombat) {
      mutate((draft) => DF.pushLog(draft, { type: "system", text: "You cannot travel during combat." }));
      return;
    }
    const id = nodeId || ctx.getState?.().ui?.selectedNode;
    if (!id) {
      mutate((draft) => DF.pushLog(draft, { type: "system", text: "Select a destination first." }));
      return;
    }
    const state = current;
    const reachable = safeGetTravelOptions(state || {});
    if (!reachable.includes(id)) {
      mutate((draft) => DF.pushLog(draft, { type: "system", text: "Destination unreachable." }));
      return;
    }
    const node = state?.run?.nodeWeb?.nodes?.find?.((n) => n.id === id);
    const travelLabel = node?.site?.name || node?.id || id;
    mutate((draft) => {
      draft.ui.travelOpen = false;
      DF.pushLog(draft, { type: "system", text: `Traveling to ${travelLabel}.` });
    });
    triggerScene({
      scene: state?.ui?.scene || DF.SCENES.PLAY,
      payload: { travelText: `Entering ${travelLabel}` },
      onMid: (draft) => {
        moveToNode(draft, id);
        draft.ui.scenePayload = null;
      },
    });
  };

  const buildStation = () =>
    mutate((draft) => {
      const idx = draft.player.inventory.indexOf("Relay Parts");
      if (idx === -1) {
        DF.pushLog(draft, { type: "system", text: "You lack Relay Parts to build a Drop Station." });
        return;
      }
      draft.player.inventory.splice(idx, 1);
      draft.player.stationBuilt += 1;
      DF.pushLog(draft, { type: "story", text: "You assemble a crude Drop Station. A faint ward flickers to life." });
      DF.pushLog(draft, { type: "system", text: "You can now Extract here." });
    });

  const extract = () =>
    mutate((draft) => {
      const items = draft.player.inventory.splice(0);
      draft.player.extracted.push(...items);
      DF.pushLog(draft, { type: "system", text: `Extraction complete. Saved ${items.length} item(s).` });
    });

  const reviveToStart = () => {
    mutate((draft) => {
      if (draft.phase !== "dead") return;
      const next = ensureState(DF.mkNewGame(Date.now()));
      next.meta = draft.meta;
      next.player.hpMax = 10 + (next.meta.legacy.startHP || 0);
      next.player.hp = next.player.hpMax;
      setStatus(next, "exploring");
      DF.pushLog(next, { type: "system", text: "You wake at the Beacon. The mountain waits." });
      primePrepPrompts(next);
      Object.assign(draft, next);
    });
    triggerScene({ scene: DF.SCENES.PREP });
  };

  const quitToPrep = () => {
    mutate((draft) => {
      const next = ensureState(DF.mkNewGame(Date.now()));
      next.meta = draft.meta;
      setStatus(next, "exploring");
      DF.pushLog(next, { type: "system", text: "You step away from the fall, back to preparation." });
      primePrepPrompts(next);
      Object.assign(draft, next);
    });
    triggerScene({ scene: DF.SCENES.PREP });
  };

  const promotionElement = (key) =>
    mutate((draft) => {
      draft.player.element = key;
      draft.player.crossStyle = null;
      draft.player.promoTier = 1;
      draft.ui.showPromotion = false;
      recalcPlayer(draft);
      DF.pushLog(draft, { type: "system", text: `Promotion: Affinity ${key.toUpperCase()}.` });
    });

  const promotionCross = (key) =>
    mutate((draft) => {
      draft.player.crossStyle = key;
      draft.player.element = null;
      draft.player.promoTier = 1;
      draft.ui.showPromotion = false;
      recalcPlayer(draft);
      DF.pushLog(draft, { type: "system", text: `Promotion: Cross-Training ${key.toUpperCase()}.` });
    });

  const promotionLater = () =>
    mutate((draft) => {
      draft.ui.showPromotion = false;
    });

  const setSceneDirect = (scene, payload) => {
    if (!scene) return;
    triggerScene({ scene, payload });
  };

  const setScreenDirect = (screen) =>
    mutate((draft) => {
      if (!screen) return;
      draft.ui.screen = screen;
    });

  const startRun = () => {
    mutate((draft) => {
      appendIntroLog(draft);
      primePrepPrompts(draft);
      DF.pushLog(draft, { type: "system", text: "Run initialized." });
    });
    triggerScene({ scene: DF.SCENES.PREP });
  };

  const handlePromptChoice = (promptId, choice) => {
    if (!promptId || !choice) return;
    mutate((draft) => {
      const entry = draft.run?.log?.find?.((l) => l.id === promptId);
      if (!entry || entry.resolved) return;
      if (entry.promptKey === "start-weapon") {
        applyWeaponChoice(draft, choice.value || choice.id, promptId);
        return;
      }
      if (entry.promptKey === "start-style") {
        applyStyleChoice(draft, choice.value || choice.id, promptId);
        triggerScene({ scene: DF.SCENES.PLAY });
        return;
      }
      resolvePromptEntry(draft, promptId, choice.id);
    });
  };

  const getActions = (state = {}) => {
    const safeState = ensureState(structuredClone(state));
    const scene = safeState.ui?.scene;
    const actions = [];
    const canTravel = safeState.phase === "play" && !safeState.run.inCombat;
    const canExtractHere =
      safeState.player.stationBuilt > 0 ||
      safeState.run.site?.key === "ruined_relay" ||
      safeState.run.nodeWeb?.nodes?.find?.((n) => n.id === safeState.run.currentNodeId)?.kind === "station";

    if (scene === DF.SCENES.TITLE) return actions;
    if (scene === DF.SCENES.GAMEOVER) {
      return [
        { key: "retry", label: "Retry", hint: "1", onClick: () => director.act("RUN_RETRY") },
        { key: "quit", label: "Quit to Prep", hint: "2", onClick: () => director.act("RUN_QUIT") },
      ];
    }
    if (safeState.phase !== "play")
      return [
        { key: "reset", label: "Reset Run", hint: "1", onClick: () => director.act("RESET_RUN") },
        { key: "prep", label: "Prep Log", hint: "2", onClick: () => director.act("PRIME_PREP") },
      ];
    const contextAction = safeState.run.inCombat
      ? { key: "brace", label: "Brace", hint: "5", onClick: () => director.act("BRACE") }
      : canExtractHere
      ? { key: "extract", label: "Extract", hint: "5", onClick: () => director.act("EXTRACT") }
      : { key: "build", label: "Build Station", hint: "5", onClick: () => director.act("BUILD_STATION") };
    return [
      { key: "attack", label: "Attack", hint: "1", onClick: () => director.act("ATTACK"), disabled: !safeState.run.inCombat },
      { key: "rest", label: "Rest", hint: "2", onClick: () => director.act("REST"), disabled: safeState.run.inCombat },
      { key: "travel", label: "Travel", hint: "3", onClick: () => director.act("TRAVEL_OPEN"), disabled: !canTravel },
      { ...contextAction, disabled: contextAction.key !== "brace" && safeState.run.inCombat },
    ];
  };

  const director = {
    prepareState: ensureState,
    bind(hooks) {
      ctx.getState = hooks?.getState || null;
      ctx.updateState = hooks?.setState || null;
    },
    bootstrap() {
      mutate((draft) => {
        ensureState(draft);
        appendIntroLog(draft);
        primePrepPrompts(draft);
      });
    },
    act(actionKey, payload = {}) {
      switch (actionKey) {
        case "START_RUN":
          startRun();
          return;
        case "PROMPT_CHOICE":
          handlePromptChoice(payload.promptId, payload.choice);
          return;
        case "ATTACK":
          combatAction("attack");
          return;
        case "BRACE":
          combatAction("defend");
          return;
        case "REST":
          rest();
          return;
        case "TRAVEL_OPEN":
          travelOpen();
          return;
        case "TRAVEL_SELECT":
          travelSelect(payload.nodeId);
          return;
        case "TRAVEL_CONFIRM":
          travelConfirm(payload.nodeId);
          return;
        case "TRAVEL_CLOSE":
          travelClose();
          return;
        case "OPEN_MENU":
          mutate((draft) => (draft.ui.menuOpen = true));
          return;
        case "CLOSE_MENU":
          mutate((draft) => (draft.ui.menuOpen = false));
          return;
        case "BUILD_STATION":
          buildStation();
          return;
        case "EXTRACT":
          extract();
          return;
        case "CHECK_NODE":
          checkNode();
          return;
        case "RUN_RETRY":
          reviveToStart();
          return;
        case "RUN_QUIT":
          quitToPrep();
          return;
        case "RESET_RUN":
          quitToPrep();
          return;
        case "PRIME_PREP":
          mutate((draft) => primePrepPrompts(draft));
          return;
        case "PROMOTION_ELEMENT":
          promotionElement(payload.key);
          return;
        case "PROMOTION_CROSS":
          promotionCross(payload.key);
          return;
        case "PROMOTION_LATER":
          promotionLater();
          return;
        case "SCENE_SET":
          setSceneDirect(payload.scene, payload.payload ?? payload);
          return;
        case "UI_SET_SCREEN":
          setScreenDirect(payload.screen);
          return;
        default:
          return;
      }
    },
    getActions(state) {
      return getActions(state || {});
    },
    getTravelOptions(state) {
      return safeGetTravelOptions(state || {});
    },
  };

  DF.director = director;
})();
