import { user } from "drizzle/schemas/auth-schema";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { twMerge } from "tailwind-merge";
import { honoClient } from "~libs/hono-actions";

async function updateUsername(
  prevState: { message: string; username?: string } | null,
  formData: FormData
) {
  const username = formData.get("username")?.toString();

  if (!username) {
    return { message: "Bad form data" };
  }

  const resp = await honoClient.api.updateUserName.$post({
    json: { name: username },
  });

  if (resp.ok) {
    return {
      message: `User name was successfully updated to ${username}`,
      username,
    };
  }

  return {
    message: "Something went wrong, try again.",
  };
}

export const Account = ({ currentUsername }: { currentUsername: string }) => {
  const [actionResp, signupAction] = useActionState(updateUsername, null);
  console.log("🚀 ~ message:", actionResp);
  const { pending } = useFormStatus();

  return (
    <main className="grid h-screen">
      <div className="content-around px-4 py-8 pb-24 ">
        <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-bold text-2xl">Account Settings</h1>
            <a href="/" className="btn btn-ghost">
              🏠
            </a>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="mb-4 font-semibold text-xl">Change Username</h2>
              <form
                id="update-username-form"
                className="space-y-4"
                action={signupAction}
              >
                <div>
                  <label
                    htmlFor="username"
                    className="block font-medium text-gray-700 text-sm"
                  >
                    New Username
                  </label>
                  <input
                    disabled={pending}
                    type="text"
                    id="username"
                    name="username"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                    minLength={3}
                    defaultValue={actionResp?.username || currentUsername}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  Update Username
                </button>
              </form>
            </div>
            <div className="border-t pt-6">
              <h2 className="mb-4 font-semibold text-red-600 text-xl">
                Danger Zone
              </h2>
              <div>
                <button
                  type="submit"
                  id="delete-account-btn"
                  className="btn btn-error w-full"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {actionResp && (
        <div
          key={actionResp.username}
          className={twMerge([
            "toast toast-top toast-end pointer-events-none z-50 animate-fade-out",
          ])}
        >
          <div
            className={twMerge([
              "alert",
              actionResp.username ? "alert-success" : "alert-error",
            ])}
          >
            <code>{actionResp.message}</code>
          </div>
        </div>
      )}
    </main>
  );
};
