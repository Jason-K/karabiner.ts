import type { SimultaneousConfig } from "../engine";

export const simultaneousMappings: Record<string, SimultaneousConfig> = {
  // Example (uncomment and modify to add a chord):
  // "jk": {
  //   keys: ["j", "k"],
  //   description: "J+K chord",
  //   alone?: ActionSpec[];
  //   hold?: ActionSpec[];
  //   tapTap?: ActionSpec[];
  //   tapTapHold?: ActionSpec[];
  //   thresholdMs?: number;
  //   simultaneousOptions?: SimultaneousOptions;
  //     detect_key_down_uninterruptedly?: boolean;
  //     key_down_order?: "insensitive" | "strict" | "strict_inverse";
  //     key_up_order?: "insensitive" | "strict" | "strict_inverse";
  //     key_up_when?: "any" | "all";
  //     to_after_key_up?: ActionSpec[];
  //   simultaneousThresholdMs?: number;
  // },
  //   sw: {
  //     keys: ["s", "w"],
  //     description: "S+W → CleanShot capture window",
  //     hold: [{ type: "url", url: "cleanshot://capture-window?action=copy&pin" }],
  //   },
};
