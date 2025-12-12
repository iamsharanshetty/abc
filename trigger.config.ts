import type { TriggerConfig } from "@trigger.dev/sdk/v3";

const config: TriggerConfig = {
  project: "proj_wflzdzqznvovnhtqnsep",
  maxDuration: 300, // 5 minutes max (required)
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
  dirs: ["./trigger"],
};

export default config;