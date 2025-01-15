import { authReactClient } from "../auth-clients";

export const SignOut = () => {
  return (
    <button
      type="button"
      onClick={async () => {
        await authReactClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = "/";
            },
          },
        });
      }}
    >
      Sign out
    </button>
  );
};
