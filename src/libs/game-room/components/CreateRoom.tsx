import { honoClient } from "~libs/hono-actions";

export const CreateRoom = () => {
  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          console.log("create room!");
          const formData = new FormData(e.target as HTMLFormElement);
          const name = formData.get("roomName")?.toString() || "";
          await honoClient.api.createRoom.$post({
            form: { roomName: name },
          });
          location.reload();
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
