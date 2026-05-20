import type { ToEvent } from "karabiner.ts";

export function toSendUserCommand(payload: unknown, endpoint?: string): ToEvent {
  return {
    send_user_command: {
      payload,
      endpoint,
    },
  } as unknown as ToEvent;
}

export function toFromEvent(): ToEvent {
  return { from_event: true } as unknown as ToEvent;
}
