(() => {
  const DF = window.DF;
  if (!DF) return;

  const manifest = {
images: [
  { key: "glyph",       url: "src/assets/img/glyph.svg", type: "image" },
  { key: "main_pc",     url: "src/assets/img/main_pc.png", type: "image" },
  { key: "starter_kit", url: "src/assets/img/starter_kit.png", type: "image" },
  { key: "town_tiles",  url: "src/assets/img/town_tiles.png", type: "image" },

  { key:"ui_title",      url:"src/assets/img/screens/title.png", type:"image" },
  { key:"ui_gameover",   url:"src/assets/img/screens/screen_gameover.png", type:"image" },
  { key:"ui_transition", url:"src/assets/img/screens/transition.png", type:"image" },
  { key:"ui_beacon",     url:"src/assets/img/screens/screen_beacon.png", type:"image" },

  { key:"ui_icons",   url:"src/assets/img/kit/ui_icons_basics.png", type:"image" },
  { key:"ui_input",   url:"src/assets/img/kit/ui_input.png", type:"image" },
  { key:"ui_windows", url:"src/assets/img/kit/ui_windows.png", type:"image" },
  { key:"ui_dice",    url:"src/assets/img/kit/ui_dice.png", type:"image" },
  { key:"ui_hud",     url:"src/assets/img/kit/ui_hud.png", type:"image" },
],

    audio: [
      // Keeps the audio system “warm” even if you haven’t added real sfx yet
      { key: "silence", url: "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=", type: "audio" },
    ],
    data: [
      { key: "flavor", url: "src/src/assets/data/flavor.json", type: "json" },
    ],
  };

  const loaders = {
    image: (entry) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Image failed to load: ${entry.url}`));
        img.src = entry.url;
      }),

    audio: (entry) =>
      new Promise((resolve, reject) => {
        const audio = new Audio();
        const cleanup = () => {
          audio.removeEventListener("canplaythrough", onReady);
          audio.removeEventListener("error", onError);
        };
        const onReady = () => { cleanup(); resolve(audio); };
        const onError = () => { cleanup(); reject(new Error(`Audio failed to load: ${entry.url}`)); };

        audio.addEventListener("canplaythrough", onReady, { once: true });
        audio.addEventListener("error", onError, { once: true });
        audio.preload = "auto";
        audio.src = entry.url;
        audio.load();
      }),

    json: async (entry) => {
      const res = await fetch(entry.url, { cache: "no-store" });
      if (!res.ok) throw new Error(`JSON failed to load (${res.status}): ${entry.url}`);
      return res.json();
    },
  };

  const buckets = { image: "images", audio: "audio", json: "data" };

  DF.ASSET_MANIFEST = manifest;

  DF.preloadsrc/assets = async ({ manifest: overrideManifest, onProgress, onLog } = {}) => {
    const activeManifest = overrideManifest || DF.ASSET_MANIFEST;
    DF.assert(activeManifest, "Asset manifest missing.");

    const queue = [
      ...(activeManifest.images || []),
      ...(activeManifest.audio || []),
      ...(activeManifest.data || []),
    ];

    const total = queue.length || 1;
    const src/assets = { images: {}, audio: {}, data: {} };
    let done = 0;

    for (const entry of queue) {
      const loader = loaders[entry.type];
      DF.assert(loader, `No loader for asset type: ${entry.type}`);

      const value = await loader(entry);
      const bucket = buckets[entry.type];
      src/assets[bucket][entry.key] = value;

      done += 1;
      if (onLog) onLog(`Loaded asset: ${entry.key}`);
      if (onProgress) onProgress({ done, total, entry });
    }

    DF.src/assets = src/assets;
    return src/assets;
  };
})();
