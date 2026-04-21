import React, { FC, useEffect, useState } from "react";

import { Box, Tab, Tabs } from "@mui/material";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";

import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useSelectedNode } from "../global-event";
import { Portal } from "../portal";

type FormTabItem = {
  title: string;
  component: FC;
};

const __forms = new Map<string, FormTabItem[]>();

export const registerRightForms = (nodeType: string, forms: FormTabItem[]) => {
  __forms.set(nodeType, forms);
};

export const RightPanelForm = () => {
  const { selectedNode } = useSelectedNode();
  const { wpTheme } = useWPTheme();

  const [forms, setForms] = useState<FormTabItem[]>([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const newForms = __forms.get(selectedNode?.getType() ?? "") ?? [];
    setForms(newForms);
    setTabValue(0);
  }, [selectedNode]);

  return (
    <Portal>
      <Box
        sx={{
          position: "fixed",
          right: 0,
          top: 50,
          zIndex: wpTheme.zIndex.layout + 1,
          overflowY: "auto",
          height: "calc(100vh - 50px)",
          width: 250,
          borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: (theme) => theme.palette.background.paper,
        }}
      >
        {!selectedNode && (
          <Typography
            size="medium"
            //bold
            sx={{
              p: 2,
              textAlign: "center",
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: 1,
              m: 2,
            }}
          >
            No element selected.
            <br />
            Add or select an element to configure it here.
          </Typography>
        )}
        {selectedNode && (
          <>
            <Tabs
              onChange={(e, i) => setTabValue(i)}
              value={tabValue}
              sx={{
                backgroundColor: (theme) => theme.palette.grey[100],
              }}
              variant="scrollable"
              scrollButtons={false}
            >
              {forms.map((form, index) => (
                <Tab
                  key={index}
                  label={form.title}
                  value={index}
                  sx={{
                    textTransform: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    minWidth: 40,
                  }}
                />
              ))}
            </Tabs>
            {forms.map(
              (form, index) =>
                tabValue === index && (
                  <React.Fragment key={index}>
                    <form.component />
                  </React.Fragment>
                )
            )}
          </>
        )}
      </Box>
    </Portal>
  );
};
