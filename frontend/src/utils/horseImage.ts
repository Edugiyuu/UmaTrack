import type { SyntheticEvent } from "react";

export const horseFolder = (name: string) => name.replace(/\s+/g, "");

export const horseAsset = (name: string, file: string) =>
  `${import.meta.env.BASE_URL}horses/${horseFolder(name)}/${file}`;

/**
 * Art coverage is uneven: only some horse girls have every animation. Rather than
 * showing a broken image, walk down a list of candidates and settle on whatever
 * exists — typically the animated clip, then the still portrait.
 */
export const withImageFallback = (name: string, candidates: string[]) => {
  const urls = candidates.map((file) => horseAsset(name, file));

  return {
    src: urls[0],
    onError: (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      const next = urls[urls.indexOf(image.getAttribute("src") ?? "") + 1];
      if (next) {
        image.src = next;
      } else {
        image.style.visibility = "hidden";
      }
    }
  };
};

/** Career and training screens prefer the animated clips, then fall back to the art. */
export const horseAnimation = (name: string, preferred: string) =>
  withImageFallback(name, [preferred, "Profile1.gif", `${horseFolder(name)}1.png`]);
