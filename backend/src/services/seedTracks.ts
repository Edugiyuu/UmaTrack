import Track from "../models/track";
import { TRACK_CATALOG } from "../data/tracks";

/**
 * Keeps the track catalogue in sync with the code. Runs on boot and is idempotent:
 * tracks are matched by slug, so tweaking a grade or a prize in `tracks.ts` is enough
 * to update every environment.
 */
export const ensureTracksSeeded = async () => {
  const operations = TRACK_CATALOG.map((track) => ({
    updateOne: {
      filter: { slug: track.slug },
      update: { $set: track },
      upsert: true
    }
  }));

  const result = await Track.bulkWrite(operations, { ordered: false });
  console.log(
    `Pistas sincronizadas: ${result.upsertedCount} criadas, ${result.modifiedCount} atualizadas.`
  );
};
