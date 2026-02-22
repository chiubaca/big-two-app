import { authReactClient } from "../auth-clients";

export const SignOut = () => {
	return (
		<button
			className="btn btn-sm btn-outline border-casino-emerald/30 text-casino-cream/70 hover:bg-casino-emerald/10 hover:border-casino-emerald/50 hover:text-casino-emeraldLight transition-all"
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
