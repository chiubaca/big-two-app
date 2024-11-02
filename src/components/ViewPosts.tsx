import { useEffect, useState } from "react";
import pbClient from "../libs/pocketbase-client";

export const ViewPosts = () => {
  const [posts, setPosts] = useState<string[]>([]);

  useEffect(() => {
    const getPosts = async () => {
      console.log("debug", pbClient.authStore);

      const dbPosts = await pbClient.collection("posts").getFullList();
      console.log("🚀 ~ getPosts ~ post:", dbPosts);

      setPosts(dbPosts.map((p) => p.content));
    };

    getPosts();
  }, []);

  useEffect(() => {
    console.log("Subscribing...", pbClient.authStore);

    // Subscribe to changes in posts collection
    pbClient.collection("rooms").subscribe(
      "*",
      (e) => {
        console.log("Action:", e.action);
        console.log("Record:", e.record);

        if (e.action === "create") {
          console.log("ACTION EVENT");
          setPosts([...posts, e.record.roomName]);
        }

        // Update posts state based on the action
        //   if (e.action === "create") {
        //     setPosts((prevPosts) => [...prevPosts, e.record]);
        //   } else if (e.action === "update") {
        //     setPosts((prevPosts) =>
        //       prevPosts.map((post) => (post.id === e.record.id ? e.record : post))
        //     );
        //   } else if (e.action === "delete") {
        //     setPosts((prevPosts) =>
        //       prevPosts.filter((post) => post.id !== e.record.id)
        //     );
        //   }
        // });

        // Cleanup subscription on component unmount
        return () => {
          pbClient.collection("posts").unsubscribe();
        };
      },
      []
    );
  });

  return (
    <>
      View posts....
      {JSON.stringify(posts)}
      {posts.map((post) => {
        <div>{post}</div>;
      })}
    </>
  );
};
