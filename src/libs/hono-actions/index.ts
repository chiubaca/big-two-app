import { hc } from "hono/client";
import type { AppType } from "../../pages/api/[...path]";

export const honoClient = hc<AppType>(import.meta.env.PUBLIC_BASE_URL);
