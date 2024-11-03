import { useEffect, useState } from "react";
import pbClient from "../libs/pocketbase-client";
import Cookies from "js-cookie";

export const Login = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const getAuth = async () => {
      const cookies = document.cookie;

      const authStore = pbClient.authStore;
      authStore.loadFromCookie(cookies || "");

      // best practice to refresh the auth after loading from cookie
      authStore.isValid && (await pbClient.collection("users").authRefresh());

      setIsLoggedIn(authStore.isValid);
    };

    if (!isLoggedIn) {
      getAuth();
    }
  }, [isLoggedIn]);

  return (
    <>
      <hr />
      {/* {error && <code>{error}</code>} */}
      <h1>Login</h1>
      <div> User logged in status: {JSON.stringify(isLoggedIn)}</div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.get("email"),
              password: formData.get("password"),
            }),
          });

          const cookies = document.cookie;
          console.log("🚀 ~ onSubmit={ ~ cookies:", cookies);

          pbClient.authStore.loadFromCookie(cookies);

          setIsLoggedIn(pbClient.authStore.isValid);
          console.log("USER LOGGED IN");
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
          setIsLoggedIn(pbClient.authStore.isValid);
          console.log("USER LOGGED OUT");

          location.reload();
        }}
      >
        Log out
      </button>
    </>
  );
};
