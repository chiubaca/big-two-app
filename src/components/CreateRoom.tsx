import { actions } from "astro:actions";

export const CreateRoom = () => {
  return (
    <>
      <hr />
      <h1>Create a room</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          actions.createRoom(formData);
        }}
      >
        <label>
          Create a room
          <textarea name="roomName" />
        </label>
        <button>Create a room</button>
      </form>
    </>
  );
};
