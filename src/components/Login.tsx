import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { authReactClient } from "src/utils/auth-client";
import pbClient from "~libs/pocketbase/pocketbase-client";

export const Login = () => {
  return (
    <>
      <hr />
      <h1>Login</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          const email = formData.get("email")?.toString();
          const password = formData.get("email")?.toString();

          if (!email || !password) {
            return;
          }

          const { data, error } = await authReactClient.signIn.email({
            email,
            password,
          });
          console.log("🚀 ~ onSubmit={ ~ error:", error);
          console.log("🚀 ~ onSubmit={ ~ data:", data);

          // await fetch("/api/login", {
          //   method: "post",
          //   body: formData,
          // });

          // const cookies = document.cookie;

          // pbClient.authStore.loadFromCookie(cookies);

          // console.log("USER LOGGED IN");
          location.reload();
        }}
      >
        <label>
          Email:
          <input type="email" name="email" />
        </label>
        <label>
          Password:
          <input type="password" name="password" />
        </label>
        <button type="submit">Login</button>
      </form>
      <button
        type="button"
        onClick={() => {
          pbClient.authStore.clear();
          Cookies.set("pb_auth", "");
          console.log("USER LOGGED OUT");
          location.reload();
        }}
      >
        Log out
      </button>
    </>
  );
};
