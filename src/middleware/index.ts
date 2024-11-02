import PocketBase from "pocketbase";
import { defineMiddleware } from "astro/middleware";

/**
 * Upon every route we  initialise a new a pocket base instance and attach it our
 * Astro local context and website cookies.
 */
export const onRequest = defineMiddleware(async ({ locals, request }, next) => {
  locals.pb = new PocketBase("http://127.0.0.1:8090");

  // load the store data from the request cookie string
  locals.pb.authStore.loadFromCookie(request.headers.get("cookie") || "");

  try {
    // get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
    locals.pb.authStore.isValid &&
      (await locals.pb.collection("users").authRefresh());
  } catch (_) {
    // clear the auth store on failed refresh
    locals.pb.authStore.clear();
  }

  const response = await next();

  // send back the default 'pb_auth' cookie to the client with the latest store state
  response.headers.append(
    "set-cookie",
    locals.pb.authStore.exportToCookie({ httpOnly: false })
  );

  return response;
});