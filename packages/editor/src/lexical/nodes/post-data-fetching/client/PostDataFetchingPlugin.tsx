import { useEffect } from "react";
import { PostDataFetchingForm } from "./PostDataFetchingForm";
import { PostDataFetchingNode } from "../PostDataFetchingNode";
import { registerDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";

export const PostDataFetchingPlugin = () => {
  useEffect(() => {
    registerDataFetchingForm(PostDataFetchingNode.getType(), {
      title: "Post",
      component: PostDataFetchingForm,
    });
  }, []);

  return null;
};
