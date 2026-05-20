const runtimeProcess = globalThis as {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

export const HOME_DIR = runtimeProcess.process?.env?.HOME ?? "/Users/jason";
