import {
    buildConditionalTapHoldRules,
    buildSimpleRemapRules,
} from "../generators";
import {
    enterKeyHoldMappings,
    equalsKeyHoldMappings,
    homeEndNavigationMappings,
} from "../mappings";

export const buildHomeEndRule = () => {
  return buildSimpleRemapRules(homeEndNavigationMappings);
};

export const buildEnterRules = () => {
  return buildConditionalTapHoldRules(enterKeyHoldMappings);
};

export const buildEqualsRules = () => {
  return buildConditionalTapHoldRules(equalsKeyHoldMappings);
};
