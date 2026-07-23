import { PATHS } from "./paths";

const cmdEntry = (name: string, refDesc: string) => ({
  type: "command" as const,
  name,
  refDesc,
});

export const commandRegistry = {
  fillPassword: cmdEntry(
    `${PATHS.privCLI} -r && sleep 0.1 && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters "<c:/:command,option,control>"`,
    "Fill password",
  ),
  fillUsernameAndPassword: cmdEntry(
    `${PATHS.privCLI} -r && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters "<c:a:command>Jason<c:tab><c:/:command,option,control>"`,
    "Fill username and password",
  ),
} as const;

export type CommandRef = import("./refs").CommandRef;
