import { NotificationSetting } from "../../../game-notifications/components/NotificationsSetting";

export const SettingsModal = () => {
	return (
		<>
			<button
				type="button"
				className="btn btn-ghost btn-circle text-casino-cream/70 hover:text-casino-emeraldLight hover:bg-casino-emerald/10 border border-transparent hover:border-casino-emerald/30 transition-all"
				onClick={() =>
					(
						document?.getElementById("settings_modal") as HTMLDialogElement
					).showModal()
				}
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
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
			</button>
			<dialog id="settings_modal" className="modal backdrop-blur-sm">
				<div className="modal-box bg-casino-charcoal border border-casino-emerald/30 text-casino-cream max-w-sm">
					<h3 className="font-display text-2xl text-emerald-gradient pb-4">
						Settings
					</h3>

					<NotificationSetting />

					<div className="modal-action">
						<form method="dialog">
							<button
								className="btn btn-ghost text-casino-cream/70 hover:text-casino-emeraldLight hover:bg-casino-emerald/10 border border-casino-emerald/20"
								type="submit"
							>
								Close
							</button>
						</form>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button type="submit">close</button>
				</form>
			</dialog>

			<style>{`
				#settings_modal {
					overflow: none;
				}
			`}</style>
		</>
	);
};
