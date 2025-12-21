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
    const withScreen = (draft) => {
      if (!draft.run) draft.run = { status: "exploring" };
      if (!draft.run.status) draft.run.status = "exploring";
      if (!draft.ui) draft.ui = {};
      if (typeof draft.ui.promptedWeapon !== "boolean") draft.ui.promptedWeapon = false;
      if (typeof draft.ui.promptedStyle !== "boolean") draft.ui.promptedStyle = false;
      if (!draft.ui.scene) draft.ui.scene = defaultScene;
      if (typeof draft.ui.scenePayload === "undefined") draft.ui.scenePayload = null;
      return draft;
    };

    const [state, setState] = useState(() => withScreen(DF.mkNewGame()));
    const [toast, setToast] = useState(null);
    const [wipeKey, setWipeKey] = useState(defaultScene);
    const toastTimer = useRef(null);
    const travelTimer = useRef(null);

    useEffect(() => {
      DF.state = state;
    }, [state]);

    useEffect(() => {
      DF._setScene = (scene, payload) => {
        let resolvedScene = scene;
        setState((prev) => {
          const d = withScreen(structuredClone(prev));
          resolvedScene = resolvedScene || d.ui.scene || defaultScene;
          d.ui.scene = resolvedScene;
          d.ui.scenePayload = payload ?? null;
          return d;
        });
        setWipeKey(`${resolvedScene}-${Date.now()}`);
      };
      return () => {
        DF._setScene = null;
      };
    }, []);
    const scene = state.ui.scene || defaultScene;

    const reachableNodes = (web, currentId) => {
      if (!web || !currentId) return [];
      const out = new Set();
      for (const e of web.edges || []) {
        if (e.a === currentId) out.add(e.b);
        if (e.b === currentId) out.add(e.a);
      }
      return Array.from(out);
    };

    const travelOptions = useMemo(
      () => reachableNodes(state.run.nodeWeb, state.run.currentNodeId),
      [state.run.nodeWeb, state.run.currentNodeId]
    );

    const showToast = (msg) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2200);
    };

    const startRunFromTitle = () => {
      DF.transitionTo(DF.SCENES.PREP);
      setState((prev) => {
        const d = withScreen(structuredClone(prev));
        primePrepPrompts(d);
        return d;
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

    useEffect(() => {
      setState((prev) => {
        const d = withScreen(structuredClone(prev));
        if (!d.run.log?.length) {
          DF.pushLog(d, {
            type: "story",
            text: "Dragons rule the skies. Cities survive as beacons. The Mountain Expanse pays in blood and salvage.",
          });
          DF.pushLog(d, { type: "story", text: "Promotions require XP. Only extracted goods endure." });
        }
        return d;
      });
    }, []);

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
      DF.pushLog(draft, { type: "story", text: "You are torn into light. Then—cold stone, thin air, and the smell of ash." });
      DF.transitionTo(DF.SCENES.PLAY);
    };
    const setStatus = (draft, status) => {
      if (!draft.run) return;
      draft.run.status = status;
    };

    const hardReset = () => {
      const next = withScreen(DF.mkNewGame(Date.now()));
      next.meta = state.meta;
      next.player.hpMax = 10 + (next.meta.legacy.startHP || 0);
      next.player.hp = next.player.hpMax;
      setStatus(next, "exploring");
      DF.pushLog(next, { type: "system", text: "New run started." });
      primePrepPrompts(next);
      setState(next);
      DF.transitionTo(DF.SCENES.TITLE);
      showToast("New run.");
    };

    const chooseWeapon = (weaponKey, promptId) =>
      setState((prev) => {
        const d = withScreen(structuredClone(prev));
        applyWeaponChoice(d, weaponKey, promptId);
        return d;
      });
    const chooseStyle = (styleKey, promptId) =>
      setState((prev) => {
        const d = withScreen(structuredClone(prev));
        applyStyleChoice(d, styleKey, promptId);
        return d;
      });
    const handlePromptChoice = (promptId, choice) => {
      if (!promptId || !choice) return;
      setState((prev) => {
        const d = withScreen(structuredClone(prev));
        const entry = d.run?.log?.find?.((l) => l.id === promptId);
        if (!entry || entry.resolved) return prev;
        if (entry.promptKey === "start-weapon") {
          applyWeaponChoice(d, choice.value || choice.id, promptId);
          return d;
        }
        if (entry.promptKey === "start-style") {
          applyStyleChoice(d, choice.value || choice.id, promptId);
          return d;
        }
        if (entry.promptKey === "travel-choice") {
          moveToNode(choice.value || choice.id, promptId, d);
          return d;
        }
        resolvePromptEntry(d, promptId, choice.id);
        return d;
      });
    };

    const takeDamage = (d, amount, reason) => {
      d.player.hp = DF.clamp(d.player.hp - amount, 0, d.player.hpMax);
      DF.pushLog(d, { type: "system", text: `You take ${amount} damage (${reason}).` });
      if (d.player.hp <= 0) {
        d.phase = "dead";
        const echoes = 2 + d.run.depth + Math.floor(d.player.gold / 3);
        d.meta.echoes += echoes;
        DF.pushLog(d, { type: "story", text: "☠️ You fall. The mountain keeps what you failed to extract." });
        DF.pushLog(d, { type: "system", text: `You gain ${echoes} Echoes at the Beacon.` });
        DF.transitionTo(DF.SCENES.GAMEOVER);
      }
    };
    const ensureEncounter = (draft) => {
      const spawn = (d) => {
        if (d.run.inCombat) return d;
        const rng = DF.mulberry32(d.rngSeed ^ d.run.depth ^ 0xdead);
        const enemy = DF.pickEnemy(rng);
        d.run.inCombat = true;
        setStatus(d, "in_combat");
        d.run.enemy = { ...enemy };
        d.run.enemyHP = enemy.hp;
        DF.pushLog(d, { type: "story", text: `⚔️ ${enemy.name} appears. ${enemy.desc}` });
        return d;
      };
      if (draft) return spawn(draft);
      setState((prev) => {
        const d = structuredClone(prev);
        if (d.phase !== "play") return prev;
        return spawn(d);
      });
    };
    const enemyTurn = (d, ctx) => DF.resolveEnemyTurn(d, takeDamage, ctx);

    const endCombatWin = (d) => {
      const rng = DF.mulberry32(d.rngSeed ^ d.run.depth ^ 0xbeef);
      const loot = d.run.site?.loot ? d.run.site.loot[Math.floor(rng() * d.run.site.loot.length)] : "Scrap";
      d.player.inventory.push(loot);
      d.player.gold += 1 + Math.floor(rng() * 3);
      const xp = 2;
      d.player.xp += xp;
      d.run.inCombat = false;
      d.run.enemy = null;
      d.run.enemyHP = 0;
      d.run.danger = "cleared";
      setStatus(d, "exploring");
      const node = d.run.nodeWeb?.nodes.find((n) => n.id === d.run.currentNodeId);
      if (node) node.cleared = true;
      DF.pushLog(d, { type: "system", text: `Victory. Loot gained: ${loot}. +${xp} XP.` });
      if (d.player.promoTier === 0 && d.player.xp >= d.player.nextPromoAt) {
        d.ui.showPromotion = true;
        DF.pushLog(d, { type: "story", text: "Something in you shifts. A new discipline is ready to bind." });
      }
    };

    const choosePromotionElement = (k) =>
      setState((prev) => {
        const d = structuredClone(prev);
        d.player.element = k;
        d.player.crossStyle = null;
        d.player.promoTier = 1;
        d.ui.showPromotion = false;
        recalcPlayer(d);
        DF.pushLog(d, { type: "system", text: `Promotion: Affinity ${k.toUpperCase()}.` });
        return d;
      });
    const choosePromotionCross = (k) =>
      setState((prev) => {
        const d = structuredClone(prev);
        d.player.crossStyle = k;
        d.player.element = null;
        d.player.promoTier = 1;
        d.ui.showPromotion = false;
        recalcPlayer(d);
        DF.pushLog(d, { type: "system", text: `Promotion: Cross-Training ${k.toUpperCase()}.` });
        return d;
      });

    const moveToNode = (id, promptId, existingDraft) => {
      let travelLabel = "";
      const updater = (prev) => {
        const d = existingDraft || structuredClone(prev);
        if (d.run.inCombat) {
          DF.pushLog(d, { type: "system", text: "You cannot travel during combat." });
          return d;
        }
        const web = d.run.nodeWeb;
        if (!web) return prev;
        const cur = d.run.currentNodeId;
        if (cur === id) {
          setStatus(d, "exploring");
          return d;
        }
        const adjacent = web.edges.some((e) => (e.a === cur && e.b === id) || (e.b === cur && e.a === id));
        if (!adjacent) {
          DF.pushLog(d, { type: "system", text: "You cannot reach that node from here." });
          return d;
        }
        d.run.currentNodeId = id;
        d.ui.selectedNode = id;
        const node = web.nodes.find((n) => n.id === id);
        if (node) {
          travelLabel = node.site?.name || node.id;
          d.run.site = node.site;
          d.run.depth += 1;
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
          d.run.danger = node.kind === "fight" ? "unknown" : "cleared";
          setStatus(d, "exploring");
          DF.pushLog(d, { type: "story", text: `You move to: ${node.site.name}.` });
          DF.pushLog(d, { type: "story", text: node.site.tone });
          if (node.kind === "station") DF.pushLog(d, { type: "system", text: "A dormant relay sits here. You may Extract." });
        }
        if (promptId) resolvePromptEntry(d, promptId, id);
        return d;
      };
      setState(updater);
      if (travelLabel) {
        DF.transitionTo(DF.SCENES.TRAVEL_SPLASH, { travelText: `Entering ${travelLabel}` });
        if (travelTimer.current) clearTimeout(travelTimer.current);
        travelTimer.current = window.setTimeout(() => DF.transitionTo(DF.SCENES.PLAY), 220);
      }
    };

    const rest = () =>
      setState((prev) => {
        const d = structuredClone(prev);
        if (d.phase !== "play" || d.run.inCombat) {
          DF.pushLog(d, { type: "system", text: "You cannot rest right now." });
          return d;
        }
        setStatus(d, "resting");
        const rng = DF.mulberry32(d.rngSeed ^ d.run.depth ^ 0x3333 ^ Date.now());
        const heal = 2;
        d.player.hp = DF.clamp(d.player.hp + heal, 0, d.player.hpMax);
        DF.pushLog(d, { type: "system", text: `You rest (+${heal} HP).` });
        if (rng() < 0.5) {
          ensureEncounter(d);
          return d;
        }
        DF.pushLog(d, { type: "story", text: "The wind passes. No footsteps." });
        setStatus(d, "exploring");
        return d;
      });

    const promptTravel = () =>
      setState((prev) => {
        const d = structuredClone(prev);
        if (d.phase !== "play") {
          return d;
        }
        if (d.run.inCombat) {
          DF.pushLog(d, { type: "system", text: "Resolve combat before traveling." });
          return d;
        }
        const opts = (d.run.nodeWeb?.nodes || [])
          .filter((n) => travelOptions.includes(n.id))
          .map((n) => ({ id: n.id, label: n.site?.name || n.id, sub: n.site?.tone, value: n.id }));
        pushPrompt(d, "travel-choice", "Travel destination:", opts);
        setStatus(d, "traveling");
        return d;
      });

    const buildStation = () =>
      setState((prev) => {
        const d = structuredClone(prev);
        const idx = d.player.inventory.indexOf("Relay Parts");
        if (idx === -1) {
          DF.pushLog(d, { type: "system", text: "You lack Relay Parts to build a Drop Station." });
          return d;
        }
        d.player.inventory.splice(idx, 1);
        d.player.stationBuilt += 1;
        DF.pushLog(d, { type: "story", text: "You assemble a crude Drop Station. A faint ward flickers to life." });
        DF.pushLog(d, { type: "system", text: "You can now Extract here." });
        return d;
      });
    const extract = () =>
      setState((prev) => {
        const d = structuredClone(prev);
        const items = d.player.inventory.splice(0);
        d.player.extracted.push(...items);
        DF.pushLog(d, { type: "system", text: `Extraction complete. Saved ${items.length} item(s).` });
        return d;
      });

    const combatAction = (key) =>
      setState((prev) => {
        const d = structuredClone(prev);
        if (d.phase !== "play" || !d.run.inCombat || !d.run.enemy) return prev;
        setStatus(d, "in_combat");
        const enemy = d.run.enemy;
        const rng = DF.mulberry32(d.rngSeed ^ d.run.depth ^ 0x2222 ^ Date.now());
        const atk = DF.computeAttackMod(d.player.stats, d.player.weapon);
        const def = DF.computeDefenseMod(d.player.stats, d.player.style);
        const doAttack = (label, bonus, min, max, onMiss) => {
          const check = DF.rollCheck(rng, label, atk + bonus, enemy.dr);
          DF.pushLog(d, {
            type: "roll",
            text: `${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${
              check.success ? "SUCCESS" : "FAIL"
            }`,
          });
          if (check.success) {
            let dmg = DF.rollDamage(rng, min, max);
            if (check.d20 === 20) {
              dmg += 1;
              if (d.player.element === "fire") dmg += 1;
              DF.pushLog(d, { type: "system", text: "Critical impact." });
            }
            d.run.enemyHP = Math.max(0, d.run.enemyHP - dmg);
            DF.pushLog(d, { type: "system", text: `Enemy takes ${dmg} damage.` });
            if (d.run.enemyHP <= 0) {
              endCombatWin(d);
              return;
            }
          } else {
            if (onMiss) onMiss();
          }
          if (d.phase !== "dead") enemyTurn(d, "combat");
        };
        if (key === "attack") {
          doAttack("You attack", 0, 1, 3);
          return d;
        }
        if (key === "defend") {
          d.run._defendActive = true;
          DF.pushLog(d, { type: "system", text: `You Brace (Defense mod ${DF.fmtBonus(def)}).` });
          enemyTurn(d, "brace");
          return d;
        }
        if (key === "maneuver") {
          const check = DF.rollCheck(rng, "You Maneuver", d.player.stats.wits + d.player.stats.finesse, DF.DR.standard);
          DF.pushLog(d, {
            type: "roll",
            text: `${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${
              check.success ? "SUCCESS" : "FAIL"
            }`,
          });
          if (!check.success) takeDamage(d, 1, "misstep");
          if (d.phase !== "dead") enemyTurn(d, "counter");
          return d;
        }
        if (key === "aim") {
          DF.pushLog(d, { type: "system", text: "You Aim (+2 baked into this shot)." });
          doAttack("Aimed Shot", 2, 1, 4);
          return d;
        }
        if (key === "dash") {
          const check = DF.rollCheck(rng, "Dash Shot", atk + 1, enemy.dr);
          DF.pushLog(d, {
            type: "roll",
            text: `${check.label}: d20 ${check.d20} ${DF.fmtBonus(check.statBonus)} = ${check.total} vs DR ${check.dr} → ${
              check.success ? "SUCCESS" : "FAIL"
            }`,
          });
          if (check.success) {
            const dmg = DF.rollDamage(rng, 1, 3);
            d.run.enemyHP = Math.max(0, d.run.enemyHP - dmg);
            DF.pushLog(d, { type: "system", text: `Enemy takes ${dmg} damage.` });
            if (d.run.enemyHP <= 0) {
              endCombatWin(d);
              return d;
            }
            DF.pushLog(d, { type: "system", text: "You slip out of reach. No retaliation." });
            return d;
          }
          enemyTurn(d, "dash-fail");
          return d;
        }
        if (key === "snare") {
          DF.pushLog(d, { type: "system", text: "You set a Snare. Enemy Attack DR +2 once." });
          const old = enemy.attackDR;
          enemy.attackDR = old + 2;
          enemyTurn(d, "snare");
          enemy.attackDR = old;
          return d;
        }
        if (key === "bolt") {
          doAttack("Arc Bolt", 1, 1, 5);
          return d;
        }
        if (key === "hex") {
          const old = enemy.dr;
          enemy.dr = Math.max(8, enemy.dr - 2);
          DF.pushLog(d, { type: "system", text: "Hex: Enemy DR −2 this turn." });
          doAttack("Hexed Strike", 0, 1, 2);
          enemy.dr = old;
          return d;
        }
        if (key === "focus") {
          DF.pushLog(d, { type: "system", text: "You Focus (+2 baked into next cast)." });
          doAttack("Focused Cast", 2, 1, 4);
          return d;
        }
        if (key === "riposte") {
          doAttack("Shield-Check", 0, 1, 2);
          return d;
        }
        if (key === "bleed") {
          doAttack("Open Vein", 0, 2, 4, () => takeDamage(d, 1, "overextension"));
          return d;
        }
        if (key === "lunge") {
          doAttack("Lunge", 1, 2, 5, () => takeDamage(d, 2, "exposed"));
          return d;
        }
        return d;
      });

    const reviveToStart = () =>
      setState((prev) => {
        const d = structuredClone(prev);
        if (d.phase !== "dead") return d;
        const next = withScreen(DF.mkNewGame(Date.now()));
        next.meta = d.meta;
        next.player.hpMax = 10 + (next.meta.legacy.startHP || 0);
        next.player.hp = next.player.hpMax;
        setStatus(next, "exploring");
        DF.pushLog(next, { type: "system", text: "You wake at the Beacon. The mountain waits." });
        primePrepPrompts(next);
        DF.transitionTo(DF.SCENES.PREP);
        return next;
      });
    const quitToPrep = () =>
      setState((prev) => {
        const next = withScreen(DF.mkNewGame(Date.now()));
        next.meta = prev.meta;
        setStatus(next, "exploring");
        DF.pushLog(next, { type: "system", text: "You step away from the fall, back to preparation." });
        primePrepPrompts(next);
        DF.transitionTo(DF.SCENES.PREP);
        return next;
      });

    const currentNode = state.run.nodeWeb?.nodes.find((n) => n.id === state.run.currentNodeId);
    const canExtractHere =
      state.player.stationBuilt > 0 ||
      state.run.site?.key === "ruined_relay" ||
      currentNode?.kind === "station";

    useEffect(() => {
      if (state.phase !== "play") return;
      if (state.run.inCombat) return;
      if (state.run.danger === "unknown" && currentNode?.kind === "fight") ensureEncounter();
    }, [state.phase, state.run.inCombat, state.run.danger, state.run.currentNodeId]);

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
      h(DF.EventLog, { log: chatLog, onPromptChoice: handlePromptChoice })
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
        h(DF.WorldViewport, {
          scale: 4,
          nodeWeb: state.run.nodeWeb,
          currentNodeId: state.run.currentNodeId,
          availableTargets: travelOptions,
          selectedNodeId: state.ui.selectedNode,
          onSelectNode: (id) => moveToNode(id),
        })
      ),
      h(
        "div",
        { className: "df-viewport-card__hint" },
        h("div", { className: "df-viewport-card__hint-main" }, latestStory),
        h("div", { className: "df-viewport-card__hint-sub" }, modeLabel)
      )
    );

    const renderOverlayLayer = () => {
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
      if (scene === DF.SCENES.TITLE) return null;
      if (scene === DF.SCENES.GAMEOVER) {
        const img = DF.assets?.images?.ui_gameover;
        return h(
          "div",
          {
            style: {
              backgroundImage: img ? `url(${img.src})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              width: "100%",
              height: "100%",
            },
          },
          overlayCard("Run Ended", [
            { key: "retry", label: "Retry", primary: true, onClick: reviveToStart },
            { key: "quit", label: "Quit to Prep", onClick: quitToPrep },
          ])
        );
      }
      if (scene === DF.SCENES.TRAVEL_SPLASH) {
        const text = state.ui.scenePayload?.travelText || "Traveling…";
        return h("div", { className: "df-overlay-card" }, h("div", { className: "df-overlay-card__title" }, text));
      }
      return null;
    };

    const overlayLayer = renderOverlayLayer();

    const canTravel = state.phase === "play" && !state.run.inCombat;
    const actionButtons = (() => {
      if (scene === DF.SCENES.TITLE) return [];
      if (scene === DF.SCENES.GAMEOVER) {
        return [
          { key: "retry", label: "Retry", hint: "1", onClick: reviveToStart },
          { key: "quit", label: "Quit to Prep", hint: "2", onClick: quitToPrep },
        ];
      }
      if (state.phase !== "play")
        return [
          { key: "reset", label: "Reset Run", hint: "1", onClick: hardReset },
          {
            key: "prep",
            label: "Prep Log",
            hint: "2",
            onClick: () =>
              setState((prev) => {
                const d = withScreen(structuredClone(prev));
                primePrepPrompts(d);
                return d;
              }),
          },
        ];
      const contextAction = state.run.inCombat
        ? { key: "brace", label: "Brace", hint: "5", onClick: () => combatAction("defend") }
        : canExtractHere
        ? { key: "extract", label: "Extract", hint: "5", onClick: extract }
        : { key: "build", label: "Build Station", hint: "5", onClick: buildStation };
      return [
        { key: "attack", label: "Attack", hint: "1", onClick: () => combatAction("attack"), disabled: !state.run.inCombat },
        { key: "rest", label: "Rest", hint: "2", onClick: rest, disabled: state.run.inCombat },
        { key: "travel", label: "Travel", hint: "3", onClick: promptTravel, disabled: !canTravel },
        { ...contextAction, disabled: contextAction.key !== "brace" && state.run.inCombat },
      ];
    })();

    const worldLayer = (() => {
      if (scene === DF.SCENES.TITLE || scene === DF.SCENES.GAMEOVER) {
        const imgKey = scene === DF.SCENES.GAMEOVER ? "ui_gameover" : "ui_title";
        const img = DF.assets?.images?.[imgKey];
        return h("div", {
          style: {
            width: "100%",
            height: "100%",
            backgroundImage: img ? `url(${img.src})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          },
        });
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
                  resolved: false,
                },
              ],
              onPromptChoice: (_, choice) => {
                if (!choice) return;
                startRunFromTitle();
              },
            })
          )
        : scene === DF.SCENES.GAMEOVER
        ? h(
            "div",
            { className: "df-playwindow__dialog-shell" },
            h("div", { className: "df-log-line df-log-line--system" }, "Run failed. Try again?")
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
            worldLayer,
            overlayLayer,
            dialogLayer: dialogLayerForScene,
            actionLayer: h(DF.ActionBar, { actions: actionButtons }),
            wipeKey,
          }),
          h(DF.PromotionModal, {
            state,
            onLater: () => setState((p) => ({ ...p, ui: { ...p.ui, showPromotion: false } })),
            onChooseElement: choosePromotionElement,
            onChooseCross: choosePromotionCross,
          }),
          h(DF.Toast, { toast })
        )
      )
    );
  };
})();
