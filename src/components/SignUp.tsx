import { useState } from "react";
import { actions } from "astro:actions";

export const SignUp = () => {
  const [error, setError] = useState<string>("");

  return (
    <>
      {error && <code>{error}</code>}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          console.log("🚀 ~ onSubmit={ ~ formData:", formData);

          const resp = await actions.signUp(formData);

          if (resp.error) {
            setError(JSON.stringify(resp.error.message));
          }
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
        <button>Submit</button>
      </form>
    </>
  );
};
