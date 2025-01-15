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
        <label className="w-full flex flex-col gap-3">
          <input
            className="input input-lg input-primary w-full"
            name="roomName"
            required
          />
        </label>
        <button className="btn btn-secondary btn-lg" type="submit">
          Create new room
        </button>
      </form>
    </>
  );
};
