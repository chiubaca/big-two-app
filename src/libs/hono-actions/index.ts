import { hc } from "hono/client";
import type { TestType } from "../../pages/api/[...path]";

export const honoClient = hc<TestType>(import.meta.env.PUBLIC_BASE_URL);
