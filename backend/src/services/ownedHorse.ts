import type mongoose from "mongoose";
import Horse from "../models/horse";
import User, { MAX_ENERGY } from "../models/user";

export type OwnedHorseDoc = NonNullable<
  ReturnType<InstanceType<typeof User>["horses"]["id"]>
>;

/**
 * Horses bought before the career update are missing the newer fields. Rather than
 * running a migration we top them up the first time they are read or written.
 * Returns true when something was changed and the user document has to be saved.
 */
export const normalizeOwnedHorse = (
  ownedHorse: OwnedHorseDoc,
  catalogHorse: InstanceType<typeof Horse>
) => {
  let changed = false;

  const ensure = <K extends keyof OwnedHorseDoc>(key: K, value: OwnedHorseDoc[K]) => {
    if (ownedHorse[key] === undefined || ownedHorse[key] === null) {
      ownedHorse[key] = value;
      changed = true;
    }
  };

  if (!ownedHorse.sourceHorseId) {
    ownedHorse.sourceHorseId = catalogHorse._id;
    changed = true;
  }
  ensure("cost", catalogHorse.cost);
  ensure("turnsLeft", 5);
  ensure("skillPoints", 0);
  ensure("energy", MAX_ENERGY);
  ensure("mood", 3);
  ensure("runningStyle", "pace");
  ensure("fans", 0);
  ensure("racesRun", 0);
  ensure("racesWon", 0);

  if (!ownedHorse.skills) {
    ownedHorse.skills = [] as unknown as OwnedHorseDoc["skills"];
    changed = true;
  }

  return changed;
};

export const findOwnedHorse = async (userId: string, horseId: string) => {
  const isObjectId = /^[a-f\d]{24}$/i.test(horseId);
  if (!isObjectId) {
    return null;
  }

  const catalogHorse = await Horse.findById(horseId);
  if (!catalogHorse) {
    return null;
  }

  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  const ownedHorse = user.horses.find((candidate) =>
    candidate.sourceHorseId?.toString() === catalogHorse.id || candidate.name === catalogHorse.name
  );

  if (!ownedHorse) {
    return null;
  }

  if (normalizeOwnedHorse(ownedHorse, catalogHorse)) {
    await user.save();
  }

  return { horse: catalogHorse, ownedHorse, user };
};

/**
 * Public shape of an owned horse. `_id` is the catalogue id because that is what the
 * frontend routes with; `ownedHorseId` exposes the subdocument id for the API calls
 * that need to address the copy itself.
 */
export const serializeOwnedHorse = (
  catalogHorse: InstanceType<typeof Horse>,
  ownedHorse: OwnedHorseDoc
) => {
  const plain = ownedHorse.toObject() as Record<string, unknown> & { _id: mongoose.Types.ObjectId };

  return {
    ...plain,
    _id: catalogHorse.id,
    ownedHorseId: plain._id.toString(),
    sourceHorseId: catalogHorse.id,
    cost: catalogHorse.cost
  };
};
