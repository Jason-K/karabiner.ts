import { PATHS } from "./paths";

export const commandRegistry = {
  fillPassword: `${PATHS.privCLI} -r && sleep 0.1 && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters "<c:/:command,option,control>"`,
  fillUsernameAndPassword: `${PATHS.privCLI} -r && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters "<c:a:command>Jason<c:tab><c:/:command,option,control>"`,
} as const;

export type CommandRef = keyof typeof commandRegistry;

export const FILL_PW_SENDKEYS = `${PATHS.privCLI} -r && sleep 0.1 && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters "<c:/:command,option,control>"`;

export const FILL_UN_PW_SENDKEYS = `${PATHS.privCLI} -r && ${PATHS.privCLI} -a && sleep 0.1 && ${PATHS.sendkeys} --initial-delay 0 --delay 0.005 --characters "<c:a:command>Jason<c:tab><c:/:command,option,control>"`;
