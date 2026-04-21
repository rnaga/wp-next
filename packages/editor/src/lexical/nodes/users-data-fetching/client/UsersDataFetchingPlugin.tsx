import { useEffect } from "react";
import { UsersDataFetchingForm } from "./UsersDataFetchingForm";
import { UsersDataFetchingNode } from "../UsersDataFetchingNode";
import { registerDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";

export const UsersDataFetchingPlugin = () => {
  useEffect(() => {
    registerDataFetchingForm(UsersDataFetchingNode.getType(), {
      title: "Users",
      component: UsersDataFetchingForm,
    });
  }, []);

  return null;
};
