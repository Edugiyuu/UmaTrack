import { useEffect } from "react";
import { bgMusic, type MusicScene } from "../services/bgMusic";

/** While `scene` is set, this screen's music plays over the route's; null lets it go. */
export const useMusicScene = (scene: MusicScene | null) => {
  useEffect(() => {
    if (!scene) return;
    return bgMusic.pushScene(scene);
  }, [scene]);
};
