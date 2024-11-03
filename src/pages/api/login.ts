import type { APIRoute } from "astro";
import { z } from "astro/zod";
// import pb from "../../libs/pocketbase"; // REMOVE ONCE MIDDLE WARE IS READY

export const POST: APIRoute = async ({ request, locals }) => {
  // Needed for local dev in safari
  const secureWhenInProduction = import.meta.env.PROD;
  try {
    const formData = await request.formData();

    const credentials = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const { email, password } = z
      .object({
        email: z.string().email(),
        password: z.string(),
      })
      .parse(credentials);

    await locals.pb.collection("users").authWithPassword(email, password);

    const pbAuthCookie = locals.pb.authStore.exportToCookie({
      httpOnly: false,
      secure: secureWhenInProduction,
    });

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
    console.warn("❌ SERVER ERROR LOGGING USER IN: ", error);
    return new Response(
      JSON.stringify({
        error: "something went wrong",
      })
    );
  }
};
