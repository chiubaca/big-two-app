import { createAuthClient as createReactAuthClient } from "better-auth/react";
import { createAuthClient } from "better-auth/client";

export const authReactClient = createReactAuthClient();

export const authClient = createAuthClient();
