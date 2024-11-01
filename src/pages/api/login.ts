import type { APIRoute } from "astro";
import { z } from "astro/zod";
import pb from "../../libs/pocketbase"; // REMOVE ONCE MIDDLE WARE IS READY

export const POST: APIRoute = async ({ request, locals }) => {
  // const pb = locals.pb;
  try {
    const json = await request.json();
    console.log("🚀 ~ constPOST:APIRoute= ~ request:", json);

    const { email, password } = z
      .object({
        email: z.string().email(),
        password: z.string(),
      })
      .parse(json);

    const authData = await pb
      .collection("users")
      .authWithPassword(email, password);

    const pbAuthCookie = pb.authStore.exportToCookie({ httpOnly: false });

    return new Response(
      JSON.stringify({
        message: "This was a POST!",
      }),
      {
        headers: {
          "Set-Cookie": pbAuthCookie,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.log("🚀 ~ constPOST:APIRoute= ~ error:", error);
    return new Response(
      JSON.stringify({
        error: "something went wrong",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
