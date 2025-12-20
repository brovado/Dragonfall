(() => {
  const DF = window.DF;
  if (!DF) return;

  const manifest = {
    images: [
      { key: "glyph", url: "./src/assets/img/glyph.svg", type: "image",
      key: "main_pc", url: "./src/assets/img/main_pc.png", type: "image",
       key: "glyph", url: "./src/assets/img/starter_kit.png", type: "image",
       key: "glyph", url: "./src/assets/img/town_tiles.png", type: "image",
      },
    ],
    audio: [
      { key: "silence", url: "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=", type: "audio" },
    ],
    data: [
      { key: "flavor", url: "./src/assets/data/flavor.json", type: "json" },
    ],
  };

  const loaders = {
    image: (entry) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error(`Image failed to load: ${entry.url}`));
        img.src = entry.url;
      }),
    audio: (entry) =>
      new Promise((resolve, reject) => {
        const audio = new Audio();
        const cleanup = () => {
          audio.removeEventListener("canplaythrough", onReady);
          audio.removeEventListener("error", onError);
        };
        const onReady = () => {
          cleanup();
          resolve(audio);
        };
        const onError = () => {
          cleanup();
          reject(new Error(`Audio failed to load: ${entry.url}`));
        };
        audio.addEventListener("canplaythrough", onReady, { once: true });
        audio.addEventListener("error", onError, { once: true });
        audio.src = entry.url;
        audio.load();
      }),
    json: async (entry) => {
      const res = await fetch(entry.url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`JSON failed to load: ${entry.url}`);
      return res.json();
    },
  };

  const buckets = { image: "images", audio: "audio", json: "data" };

  DF.ASSET_MANIFEST = manifest;

  DF.preloadAssets = async ({
    manifest: overrideManifest,
    onProgress,
    onLog,
  } = {}) => {
    const activeManifest = overrideManifest || DF.ASSET_MANIFEST;
    DF.assert(activeManifest, "Asset manifest missing.");
    const queue = [
      ...(activeManifest.images || []),
      ...(activeManifest.audio || []),
      ...(activeManifest.data || []),
    ];
    const total = queue.length;
    const assets = { images: {}, audio: {}, data: {} };
    let done = 0;

    const notify = (entry) => {
      done += 1;
      if (onLog) onLog(`Loaded asset: ${entry.key}`);
      if (onProgress) onProgress({ done, total, entry });
    };

    for (const entry of queue) {
      const loader = loaders[entry.type];
      DF.assert(loader, `No loader for asset type: ${entry.type}`);
      const value = await loader(entry);
      const bucket = buckets[entry.type];
      assets[bucket][entry.key] = value;
      notify(entry);
    }

    DF.assets = assets;
    return assets;
  };
})();
