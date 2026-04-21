import { Box } from "@mui/material";
import { useSelectedNode } from "../../../../client/global-event";
import {
  FormFlexBox,
  FormStyleControl,
} from "../../../../client/forms/components";
import { useState } from "react";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { EmbedModal } from "../../../../client/forms/components/EmbedModal";

export const EmbedRightPanelForm = () => {
  const { selectedNode } = useSelectedNode();
  const [openModal, setOpenModal] = useState(false);

  if (!selectedNode) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
      }}
    >
      <EmbedModal
        node={selectedNode}
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={() => setOpenModal(false)}
      />

      <FormFlexBox>
        <FormStyleControl title="" width="100%">
          <Button
            size="medium"
            onClick={() => {
              setOpenModal(true);
            }}
          >
            <Typography>Open Embed Editor</Typography>
          </Button>
        </FormStyleControl>
      </FormFlexBox>
    </Box>
  );
};
