import { useEffect, useState } from "react";

/** One download per GIF; every screen visit gets its own object URL from it. */
const downloads = new Map<string, Promise<Blob | null>>();

const download = (url: string) => {
  let pending = downloads.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((response) =>
        // A missing file comes back as the app's HTML (SPA fallback), not as an image.
        response.ok && response.headers.get("content-type")?.startsWith("image/") ? response.blob() : null
      )
      .catch(() => null);
    downloads.set(url, pending);
  }
  return pending;
};

/**
 * A GIF that plays once (no loop block) only plays the first time the browser shows its
 * URL: later visits get the finished last frame. This hands each mount a fresh object
 * URL for the same bytes, so it plays again on every visit. Null until it is ready, or
 * when the file does not exist (the caller keeps its own fallback).
 */
export const useFreshGif = (url: string | null) => {
  const [fresh, setFresh] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let live = true;
    let objectUrl: string | null = null;
    download(url).then((blob) => {
      if (!live || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setFresh(objectUrl);
    });
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setFresh(null);
    };
  }, [url]);

  return fresh;
};
