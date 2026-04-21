import {
  Box,
  Button,
  IconButton,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import * as types from "../../types";
import { Fragment, useEffect, useState, useTransition } from "react";
import { ManageCSSVariables } from "./ManageCSSVariables";
import { logger } from "../../lexical/logger";

// Import Edit and Delete icon
import { BasicIconMenuButton } from "../forms/components/BasicIconMenuButton";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useCSSVariables } from "./CSSVariablesContext";

// Styled TableCell
const TableHeadCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
}));

export const ListCSSVariables = (props: {
  ID?: number; // ID of the CSS Variables
}) => {
  const { ID } = props;
  const [editor] = useLexicalComposerContext();
  const [manage, setManage] = useState({
    open: false,
    selectedVariableIndex: undefined as number | undefined,
    cssVariables: undefined as types.CSSVariables | undefined,
  });
  const [loading, startTransition] = useTransition();
  const { delItem, cssVariablesList } = useCSSVariables();

  // Find the CSS Variables by ID
  // If ID is not provided, select the first one
  const cssVariables = ID
    ? cssVariablesList.find((item) => item.ID === ID)
    : cssVariablesList[0];

  const handleCloseManage = () => {
    setManage({
      ...manage,
      selectedVariableIndex: undefined,
      open: false,
    });
  };

  const handleMenuClick = (action: string, index: number) => {
    if (action === "edit") {
      setManage({
        ...manage,
        selectedVariableIndex: index,
        open: true,
      });
    }

    if (action === "delete") {
      handleDelete(index);
    }
  };

  const handleCreate = () => {
    setManage({
      ...manage,
      open: true,
    });
  };

  const handleDelete = (index: number) => {
    startTransition(async () => {
      const [success, newContent] = await delItem(cssVariables!, index);

      if (!success) {
        logger.error("Error deleting CSS variable");
        return;
      }

      setManage({
        ...manage,
        selectedVariableIndex: undefined,
        open: false,
      });

      // setCSSVariables({
      //   ...cssVariables!,
      //   content: newContent,
      // });
    });
  };

  // useEffect(() => {
  //   setCSSVariables(props.cssVariables);
  // }, [props.cssVariables]);

  if (!cssVariables) {
    return null!;
  }

  return (
    <>
      <ManageCSSVariables
        open={manage.open}
        onClose={handleCloseManage}
        variableIndex={manage.selectedVariableIndex}
        cssVariables={cssVariables}
      />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 1,
            padding: 2,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {cssVariables.content.length == 0 ? (
            <Typography
              size="large"
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                my: 5,
              }}
            >
              No CSS Variables
            </Typography>
          ) : (
            <TableContainer>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Syntax</TableHeadCell>
                    <TableHeadCell>Inherit</TableHeadCell>
                    <TableHeadCell>Initial Value</TableHeadCell>
                    <TableHeadCell></TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cssVariables.content.map((cssVariable, index) => (
                    <Fragment key={cssVariable.variableName}>
                      <TableRow
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {cssVariable.variableName}
                        </TableCell>
                        <TableCell>{cssVariable.syntax}</TableCell>
                        <TableCell>
                          {cssVariable.inherit ? "true" : "false"}
                        </TableCell>
                        <TableCell>{cssVariable.initialValue}</TableCell>
                        <TableCell>
                          <BasicIconMenuButton
                            size="medium"
                            onChange={(value) => handleMenuClick(value, index)}
                            items={[
                              { label: "Edit", value: "edit" },
                              { label: "Delete", value: "delete" },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            onClick={handleCreate}
            sx={{
              textTransform: "none",
            }}
            disableElevation
          >
            Create New CSS Variable
          </Button>
        </Box>
      </Box>
    </>
  );
};
