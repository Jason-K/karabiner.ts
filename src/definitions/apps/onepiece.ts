import { appRegistry } from "../../data";
import {
    generatePointerRemapRule,
    type PointerRemapConfig,
} from "../../engine/pointer-remap-rules";

export const onePieceClickEnter: PointerRemapConfig = {
  button: "button1",
  description: "OnePiece left click -> enter",
  to: [{ type: "key", key: "return_or_enter" }],
  ifApp: appRegistry.onePiece,
};

export const buildOnePieceClickEnterRule = () =>
  generatePointerRemapRule(onePieceClickEnter);
