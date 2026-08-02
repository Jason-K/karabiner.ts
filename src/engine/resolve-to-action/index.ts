import type { ToEvent } from "../../types/karabiner";
import type { Action } from "../../data";
import { ensurePathQuotingInCommand } from "../utils";

import { actionToEvents, isActionSpec } from "./action-handlers";

export * from "./action-handlers";
export * from "./resolve-app";
export * from "./resolve-conditions";
export * from "./resolve-folder";
export * from "./resolve-map";
export * from "./resolve-script";

/** Normalize path quoting inside any shell command an action produced. */
function normalizeToEvent(event: ToEvent): ToEvent {
  if (event && typeof event === "object" && "shell_command" in event) {
    return {
      ...event,
      shell_command: ensurePathQuotingInCommand(event.shell_command),
    };
  }
  return event;
}

/**
 * Compile one `do` entry into Karabiner `to` events.
 *
 * Entries are either a high-level {@link import('../../data').ActionSpec},
 * dispatched through the handler registry, or a raw `ToEvent` passed through
 * verbatim (used by mouse bindings for events the DSL does not model).
 */
export function resolveActionToEvents(action: Action): ToEvent[] {
  const events = isActionSpec(action) ? actionToEvents(action) : [action];
  return events.map(normalizeToEvent);
}
