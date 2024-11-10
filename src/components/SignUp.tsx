import { actions } from "astro:actions";
import { useState } from "react";

export const SignUp = () => {
  const [error, setError] = useState<string>("");

  return (
    <>
      {error && <code>{error}</code>}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          const resp = await actions.signUp(formData);

          if (resp.error) {
            setError(JSON.stringify(resp.error.message));
            return;
          }

          await fetch("/api/login", {
            method: "POST",
            body: formData,
          });
          location.reload();
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
