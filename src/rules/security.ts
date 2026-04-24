import {
  buildConditionalActionRules,
  buildDisabledShortcutRules,
} from "../generators";
import { disabledShortcuts, securitySlashActionMappings } from "../mappings";

export const buildDisableHideMinimizeRule = () => {
  return buildDisabledShortcutRules(disabledShortcuts);
};

export const buildWordPrivilegesRule = () => {
  return buildConditionalActionRules([securitySlashActionMappings[0]!])[0]!;
};

export const buildPasswordsQuickFillRule = () => {
  return buildConditionalActionRules([securitySlashActionMappings[1]!])[0]!;
};
