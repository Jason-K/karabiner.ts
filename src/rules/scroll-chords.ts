import { ifApp, map, rule, toKey } from "karabiner.ts";

import { formatRuleDescription } from "../lib/rule-descriptions";
import {
    scrollChordBrowserBundleIds,
    scrollChordTriggerKeys,
} from "../mappings/scroll-chords";

const browserTabsCondition = ifApp({
  bundle_identifiers: [...scrollChordBrowserBundleIds],
});

export function buildScrollChordRules() {
  return [
    rule(
      formatRuleDescription(
        [scrollChordTriggerKeys.volumeUp],
        "Scroll chord volume up bridge",
        "tap",
      ),
    ).manipulators([
      ...map(scrollChordTriggerKeys.volumeUp)
        .to(toKey("volume_increment", [], { repeat: false }))
        .build(),
    ]),
    rule(
      formatRuleDescription(
        [scrollChordTriggerKeys.volumeDown],
        "Scroll chord volume down bridge",
        "tap",
      ),
    ).manipulators([
      ...map(scrollChordTriggerKeys.volumeDown)
        .to(toKey("volume_decrement", [], { repeat: false }))
        .build(),
    ]),
    rule(
      formatRuleDescription(
        [scrollChordTriggerKeys.appSwitcherNext],
        "Scroll chord next app bridge",
        "tap",
      ),
    ).manipulators([
      ...map(scrollChordTriggerKeys.appSwitcherNext)
        .to(toKey("tab", ["left_command"], { repeat: false }))
        .build(),
    ]),
    rule(
      formatRuleDescription(
        [scrollChordTriggerKeys.appSwitcherPrevious],
        "Scroll chord previous app bridge",
        "tap",
      ),
    ).manipulators([
      ...map(scrollChordTriggerKeys.appSwitcherPrevious)
        .to(toKey("tab", ["left_command", "left_shift"], { repeat: false }))
        .build(),
    ]),
    rule(
      formatRuleDescription(
        [scrollChordTriggerKeys.tabSwitcherNext],
        "Scroll chord next tab bridge",
        "tap",
      ),
    ).manipulators([
      ...map(scrollChordTriggerKeys.tabSwitcherNext)
        .condition(browserTabsCondition)
        .to(toKey("page_up", ["left_control"], { repeat: false }))
        .build(),
      ...map(scrollChordTriggerKeys.tabSwitcherNext)
        .condition(browserTabsCondition.unless())
        .to(toKey("tab", ["left_control"], { repeat: false }))
        .build(),
    ]),
    rule(
      formatRuleDescription(
        [scrollChordTriggerKeys.tabSwitcherPrevious],
        "Scroll chord previous tab bridge",
        "tap",
      ),
    ).manipulators([
      ...map(scrollChordTriggerKeys.tabSwitcherPrevious)
        .condition(browserTabsCondition)
        .to(toKey("page_down", ["left_control"], { repeat: false }))
        .build(),
      ...map(scrollChordTriggerKeys.tabSwitcherPrevious)
        .condition(browserTabsCondition.unless())
        .to(toKey("tab", ["left_control", "left_shift"], { repeat: false }))
        .build(),
    ]),
  ];
}
