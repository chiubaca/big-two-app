import { useState } from "react";
import { authReactClient } from "../auth-clients";

export const SignUp = () => {
  const [error, setError] = useState<string>("");

  return (
    <>
      {error && <code>{error}</code>}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          const name = formData.get("name")?.toString();
          const email = formData.get("email")?.toString();
          const password = formData.get("password")?.toString();

          if (!name || !email || !password) {
            return;
          }

          const data = await authReactClient.signUp.email({
            email,
            name,
            password,
          });
          console.log("🚀 ~ onSubmit={ ~ data:", data);
        }}
      >
        <label>
          Username:
          <input type="text" name="name" />
        </label>
        <label>
          Email:
          <input type="email" name="email" />
        </label>
        <label>
          Password:
          <input type="password" name="password" />
        </label>
        <button type="submit">Submit</button>
      </form>
    </>
  );
};
