/** A career goal in words: "vencer" for a win-only goal, "top 3" otherwise. */
export const goalLabel = (goal: number) => (goal === 1 ? 'vencer' : `top ${goal}`);
