import { useRef, useState } from "react";
import { Button } from "@rnaga/wp-next-ui/Button";
import { FormFlexBox, FormStyleControl } from "../../../forms/components";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useElementState } from "../../ElementStateContext";
import { DraggableCustomProperties } from "./DraggableCustomProperties";
import { HelpText } from "../../../forms/components/HelpText";

export const StyleCustomProperties = () => {
  const { elementState } = useElementState();
  const [open, setOpen] = useState(false);
  const targetRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <DraggableCustomProperties
        open={open}
        onClose={() => setOpen(false)}
        targetRef={targetRef}
      />

      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl width="100%">
          <Button
            ref={targetRef as any}
            size="small"
            onClick={() => setOpen(true)}
            sx={{
              width: "100%",
            }}
            //disabled={elementState !== "none"}
          >
            <Typography fontSize={10}>Configure Custom Properties</Typography>
          </Button>
          <HelpText sx={{ mt: 0.5 }}>
            Note: Custom properties override other form properties
          </HelpText>
        </FormStyleControl>
      </FormFlexBox>
    </>
  );
};
