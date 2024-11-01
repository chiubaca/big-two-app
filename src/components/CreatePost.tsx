import { actions } from "astro:actions";

export const CreatePost = () => {
  return (
    <>
      <hr />
      <h1>Add a Post</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          actions.createPost(formData);
        }}
      >
        <label>
          add post
          <textarea name="post" />
        </label>
        <button>Add post</button>
      </form>
    </>
  );
};
