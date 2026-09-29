import type mongoose from "mongoose";
import Horse from "../models/horse";
import User, { MAX_ENERGY } from "../models/user";
import { careerView } from "./career";

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
  ensure("runningStyle", "pace");
  ensure("fans", 0);
  ensure("racesRun", 0);
  ensure("racesWon", 0);

  // Mood was removed (task 26): drop it from older saves so it is not stored forever.
  if (ownedHorse.get("mood") !== undefined) {
    ownedHorse.set("mood", undefined, { strict: false });
    changed = true;
  }

  if (!ownedHorse.skills) {
    ownedHorse.skills = [] as unknown as OwnedHorseDoc["skills"];
    changed = true;
  }
  // Horses from before the career update start their calendar at the first race.
  if (!ownedHorse.career?.status) {
    ownedHorse.career = { status: "active", raceIndex: 0, results: [] } as unknown as OwnedHorseDoc["career"];
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

  // A horse girl can have several copies: retired careers kept as records and at most
  // one running. Routes address her by catalogue id, which means the running copy, or
  // the most recent retired one when none is running.
  const copies = user.horses.filter((candidate) =>
    candidate.sourceHorseId?.toString() === catalogHorse.id || candidate.name === catalogHorse.name
  );
  const ownedHorse =
    copies.find((candidate) => !candidate.career?.status || candidate.career.status === "active") ??
    copies.at(-1);

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
/**
 * The saved horse as a plain object, minus the fields the game no longer has. Saves not
 * yet read by `normalizeOwnedHorse` can still carry them (mood, removed in task 26).
 */
export const plainOwnedHorse = (ownedHorse: OwnedHorseDoc) => {
  const plain = ownedHorse.toObject() as Record<string, unknown>;
  delete plain.mood;
  return plain;
};

export const serializeOwnedHorse = (
  catalogHorse: InstanceType<typeof Horse>,
  ownedHorse: OwnedHorseDoc
) => {
  const plain = plainOwnedHorse(ownedHorse) as Record<string, unknown> & { _id: mongoose.Types.ObjectId };

  return {
    ...plain,
    _id: catalogHorse.id,
    ownedHorseId: plain._id.toString(),
    sourceHorseId: catalogHorse.id,
    cost: catalogHorse.cost,
    career: careerView(ownedHorse)
  };
};
