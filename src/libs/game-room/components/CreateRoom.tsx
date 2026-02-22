import { honoClient } from "~libs/hono-actions";

export const CreateRoom = () => {
	return (
		<>
			<form
				className="flex flex-col gap-3"
				onSubmit={async (e) => {
					e.preventDefault();
					try {
						const formData = new FormData(e.target as HTMLFormElement);
						const name = formData.get("roomName")?.toString() || "";

						await honoClient.api.createRoom.$post({
							json: { roomName: name },
						});

						location.reload();
					} catch (error) {
						console.log("🚀 ~ onSubmit={ ~ error:", error);
					}
				}}
			>
				<label className="w-full flex flex-col gap-2">
					<span className="text-casino-cream/50 text-sm">Room name</span>
					<input
						className="input input-lg bg-casino-black/50 border-casino-emerald/20 text-casino-cream placeholder:text-casino-cream/30 focus:border-casino-emerald/50 transition-colors w-full"
						name="roomName"
						placeholder="Enter room name..."
						required
					/>
				</label>
				<button
					className="btn bg-casino-emerald text-casino-cream font-medium border-none hover:bg-casino-emeraldLight hover:shadow-emerald btn-lg mt-2"
					type="submit"
				>
					Create Room
				</button>
			</form>
		</>
	);
};
