import { useEffect } from "react";
import { CommentDataFetchingForm } from "./CommentDataFetchingForm";
import { CommentDataFetchingNode } from "../CommentDataFetchingNode";
import { registerDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";

export const CommentDataFetchingPlugin = () => {
  useEffect(() => {
    registerDataFetchingForm(CommentDataFetchingNode.getType(), {
      title: "Comment",
      component: CommentDataFetchingForm,
    });
  }, []);

  return null;
};
