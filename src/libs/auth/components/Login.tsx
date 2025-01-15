import { authReactClient } from "../auth-clients";

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
    </>
  );
};
