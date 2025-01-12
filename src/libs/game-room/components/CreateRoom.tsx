import { honoClient } from "~libs/hono-actions";

export const CreateRoom = () => {
  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const formData = new FormData(e.target as HTMLFormElement);
            const name = formData.get("roomName")?.toString() || "";

            const foo = await honoClient.api.createRoom.$post({
              json: { roomName: name },
            });

            location.reload();
          } catch (error) {
            console.log("🚀 ~ onSubmit={ ~ error:", error);
          }
        }}
      >
        <label>
          Create a room
          <input
            className="input input-bordered w-full max-w-xs"
            name="roomName"
          />
        </label>
        <button className="btn" type="submit">
          Create a room
        </button>
      </form>
    </>
  );
};
