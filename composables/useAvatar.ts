export type Avatar = "boy" | "girl";

const path = {
  boy: "svg/task-holdem/person-boy.svg",
  girl: "svg/task-holdem/person-girl.svg",
};

/**
 * Returns the path of an avatar image based on the provided avatar type.
 *
 * @param avatar - The type of avatar (optional).
 * @returns The path of the avatar image.
 */
export default function (avatar?: Avatar): string {
  switch (avatar) {
    case "boy":
      return path.boy;
    case "girl":
      return path.girl;
    default:
      return path.boy;
  }
}
