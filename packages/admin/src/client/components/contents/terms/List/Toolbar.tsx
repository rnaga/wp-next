import { ReactNode, useContext } from "react";

import { Box } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { InputSearch } from "@rnaga/wp-next-ui/InputSearch";
import { Pagination } from "@rnaga/wp-next-ui/list/Pagination";

import { useWPAdmin } from "../../../../wp-admin";
import { TermsContext } from "./";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Toolbar = (props: {
  terms?: wpCoreTypes.actions.Terms;
  info?: wpCoreTypes.actions.TermsInfo;
  children?: ReactNode;
}) => {
  const { info, children } = props;
  const {
    wp: { viewport },
  } = useWPAdmin();

  const {
    edit: { addNew },
    permissions,
    taxonomy,
  } = useContext(TermsContext);

  const canCreate =
    (true === taxonomy?.hierarchical && permissions?.edit_terms) ||
    (false === taxonomy?.hierarchical && permissions?.assign_terms);

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        {canCreate && <Button onClick={() => addNew()}>Create New Term</Button>}
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: viewport.isMobile ? "1fr" : "repeat(2, 1fr) 2fr",
        }}
      >
        {children} <InputSearch size="medium" />
        <Pagination pagination={info?.pagination} />
      </Box>
    </>
  );
};
