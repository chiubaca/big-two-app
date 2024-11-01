import { useEffect, useState } from "react";
import pb from "../libs/pocketbase";
import Cookies from "js-cookie";

export const Login = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const getAuth = async () => {
      const cookies = document.cookie;

      const authStore = pb.authStore;
      authStore.loadFromCookie(cookies || "");

      // best practice to refresh the auth after loading from cookie
      authStore.isValid && (await pb.collection("users").authRefresh());

      console.log("Got auth sotre", authStore);
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
          pb.authStore.loadFromCookie(cookies);

          setIsLoggedIn(pb.authStore.isValid);
          console.log("USER LOGGED IN");
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
        <button>Login</button>
      </form>

      <button
        onClick={() => {
          pb.authStore.clear();
          Cookies.set("pb_auth", "");
          setIsLoggedIn(pb.authStore.isValid);
          console.log("USER LOGGED OUT");
        }}
      >
        Log out
      </button>
    </>
  );
};
