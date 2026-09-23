import Horse from "../models/horse";
import { HORSE_CATALOG } from "../data/horses";

/**
 * Upserts the starting roster by name.
 *
 * Deliberately NOT called on boot: an existing database already has its own roster and
 * this would overwrite those stats. Run it explicitly with `npm run seed:horses` when
 * bootstrapping an empty database.
 */
export const ensureHorsesSeeded = async () => {
  const operations = HORSE_CATALOG.map((horse) => ({
    updateOne: {
      filter: { name: horse.name },
      update: { $set: horse },
      upsert: true
    }
  }));

  const result = await Horse.bulkWrite(operations, { ordered: false });
  console.log(
    `Cavalos sincronizados: ${result.upsertedCount} criados, ${result.modifiedCount} atualizados.`
  );
};
