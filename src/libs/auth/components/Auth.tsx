import { useState } from "react";
import { authReactClient } from "../auth-clients";

export const Auth = () => {
  const [error, setError] = useState<string>("");
  return (
    <div className="w-full ">
      <h2 className="text-2xl font-bold pb-3">Login</h2>
      <form
        onSubmit={async (e) => {
          console.log("submit..");
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          const email = formData.get("email")?.toString();
          console.log("🚀 ~ email:", email);
          const password = formData.get("password")?.toString();
          console.log("🚀 ~ password:", password);

          if (!email || !password) {
            return;
          }

          const { data, error } = await authReactClient.signIn.email({
            email,
            password,
          });
          console.log("🚀 ~ onSubmit={ ~ error:", error);
          console.log("🚀 ~ onSubmit={ ~ data:", data);

          location.reload();
        }}
        className="flex flex-col gap-3"
      >
        <EmailInput />
        <PasswordInput />
        <button className="btn btn-primary btn-lg" type="submit">
          Login
        </button>
      </form>

      <div className="divider text-base-content/50 ">or</div>

      {error && <code>{error}</code>}

      <form
        onSubmit={async (e) => {
          console.log("yo...");
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          const name = formData.get("name")?.toString();
          console.log("🚀 ~ onSubmit={ ~ name:", name);
          const email = formData.get("email")?.toString();
          console.log("🚀 ~ email:", email);
          const password = formData.get("password")?.toString();
          console.log("🚀 ~ password:", password);

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
        className="flex flex-col gap-3"
      >
        <h2 className="text-2xl font-bold pb-3">Sign up </h2>
        <UsernameInput />
        <EmailInput />
        <PasswordInput />
        <button className="btn btn-secondary btn-lg grow" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
};

const EmailInput = () => {
  return (
    <label className="input input-bordered flex items-center gap-2">
      <svg
        role="img"
        aria-label="Email icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-7 aspect-square"
      >
        <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
        <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
      </svg>
      <input type="text" className="grow" placeholder="Email" name="email" />
    </label>
  );
};

const UsernameInput = () => {
  return (
    <label className="input input-bordered   flex items-center gap-2">
      <svg
        role="img"
        aria-label="User icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-7 aspect-square"
      >
        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
      </svg>
      <input type="text" className="grow" placeholder="Username" name="name" />
    </label>
  );
};

const PasswordInput = () => {
  return (
    <label className="input input-bordered flex items-center gap-2">
      <svg
        role="img"
        aria-label="Password icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-7 aspect-square"
      >
        <path
          fillRule="evenodd"
          d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
          clipRule="evenodd"
        />
      </svg>
      <input type="password" className="grow" name="password" />
    </label>
  );
};
