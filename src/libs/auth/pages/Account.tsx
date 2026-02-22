import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { twMerge } from "tailwind-merge";
import { honoClient } from "~libs/hono-actions";

async function updateUsername(
	_formState: { message: string; username?: string } | null,
	formData: FormData,
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
			message: `Username updated to ${username}`,
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
		<main className="min-h-screen">
			<div className="px-4 py-8 pb-24">
				<div className="mx-auto max-w-md">
					<div className="mb-8 flex items-center justify-between">
						<h1 className="font-display text-3xl text-emerald-gradient">
							Account Settings
						</h1>
						<a
							href="/"
							className="btn btn-ghost btn-circle text-casino-cream/70 hover:text-casino-emeraldLight hover:bg-casino-emerald/10 border border-transparent hover:border-casino-emerald/30"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
						</a>
					</div>

					<div className="space-y-8">
						<section className="bg-casino-charcoal/60 backdrop-blur-sm rounded-xl p-6 border border-casino-emerald/20">
							<h2 className="mb-4 font-display text-xl text-casino-cream">
								Change Username
							</h2>
							<form
								id="update-username-form"
								className="space-y-4"
								action={signupAction}
							>
								<div>
									<label
										htmlFor="username"
										className="block text-casino-cream/60 text-sm mb-2"
									>
										New Username
									</label>
									<input
										disabled={pending}
										type="text"
										id="username"
										name="username"
										className="input w-full bg-casino-black/50 border-casino-emerald/20 text-casino-cream placeholder:text-casino-cream/30 focus:border-casino-emerald/50 transition-colors"
										required
										minLength={3}
										defaultValue={actionResp?.username || currentUsername}
									/>
								</div>
								<button
									type="submit"
									className="btn bg-casino-emerald text-casino-cream font-medium border-none hover:bg-casino-emeraldLight hover:shadow-emerald w-full"
								>
									Update Username
								</button>
							</form>
						</section>

						<section className="bg-casino-charcoal/60 backdrop-blur-sm rounded-xl p-6 border border-casino-cardRed/30">
							<h2 className="mb-4 font-display text-xl text-casino-cardRed">
								Danger Zone
							</h2>
							<button
								type="submit"
								id="delete-account-btn"
								className="btn bg-casino-cardRed/80 text-casino-cream font-medium border-none hover:bg-casino-cardRed w-full"
							>
								Delete Account
							</button>
						</section>
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
							"alert backdrop-blur-sm border-none",
							actionResp.username
								? "bg-casino-emerald/90 text-casino-cream"
								: "bg-casino-cardRed/90 text-casino-cream",
						])}
					>
						<span className="font-medium">{actionResp.message}</span>
					</div>
				</div>
			)}
		</main>
	);
};
