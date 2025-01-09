import { hc } from "hono/client";
import type { AppType } from "../../pages/api/[...hono]";

export const honoClient = hc<AppType>(import.meta.env.PUBLIC_BASE_URL);
