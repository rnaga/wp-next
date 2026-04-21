import { useEffect } from "react";
import { TermsDataFetchingForm } from "./TermsDataFetchingForm";
import { TermsDataFetchingNode } from "../TermsDataFetchingNode";
import { registerDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";

export const TermsDataFetchingPlugin = () => {
  useEffect(() => {
    registerDataFetchingForm(TermsDataFetchingNode.getType(), {
      title: "Terms",
      component: TermsDataFetchingForm,
    });
  }, []);

  return null;
};
