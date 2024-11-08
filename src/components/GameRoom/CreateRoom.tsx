import { actions } from "astro:actions";

export const CreateRoom = () => {
  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          await actions.createRoom(formData);
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
