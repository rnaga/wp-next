import { useEffect } from "react";
import { CommentsDataFetchingForm } from "./CommentsDataFetchingForm";
import { CommentsDataFetchingNode } from "../CommentsDataFetchingNode";
import { registerDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";

export const CommentsDataFetchingPlugin = () => {
  useEffect(() => {
    registerDataFetchingForm(CommentsDataFetchingNode.getType(), {
      title: "Comments",
      component: CommentsDataFetchingForm,
    });
  }, []);

  return null;
};
