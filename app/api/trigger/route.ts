// app/api/trigger/route.ts
import { createAppRoute } from "@trigger.dev/nextjs";
import { client } from "@/trigger/client";

import "@/trigger/analyze-website";

export const { POST, dynamic } = createAppRoute(client);
