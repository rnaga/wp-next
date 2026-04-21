import { useEffect } from "react";
import { PostsDataFetchingForm } from "./PostsDataFetchingForm";
import { PostsDataFetchingNode } from "../PostsDataFetchingNode";
import { registerDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";

export const PostsDataFetchingPlugin = () => {
  useEffect(() => {
    registerDataFetchingForm(PostsDataFetchingNode.getType(), {
      title: "Posts",
      component: PostsDataFetchingForm,
    });
  }, []);

  return null;
};
