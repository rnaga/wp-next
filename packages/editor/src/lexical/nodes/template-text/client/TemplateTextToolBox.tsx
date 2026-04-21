import { useEffect, useState } from "react";

import { useToolBox } from "../../../../client/mouse-tool/toolbox/ToolBoxContext";
import { DraggableTemplateEditor } from "./DraggableTemplateEditor";
import { useTemplateText } from "./use-template-text";

export const TemplateTextToolBox = () => {
  const { template, handleChange, selectedNode } = useTemplateText();
  const { settings } = useToolBox();
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (!selectedNode || selectedNode.getType() !== "template-text") {
      settings.disable();
      return;
    }

    settings.enable();
  }, [selectedNode]);

  useEffect(() => {
    if (settings.isOpen) {
      setOpenModal(true);
    }
  }, [selectedNode, settings.isOpen]);

  const handleCloseModal = () => {
    setOpenModal(false);
    settings.close();
  };

  if (!selectedNode || selectedNode.getType() !== "template-text") return null;

  return (
    <DraggableTemplateEditor
      open={openModal}
      onClose={handleCloseModal}
      portalTarget={document.body}
      defaultContent={template}
      onUpdate={(html) => {
        handleChange(html);
      }}
    />
  );
};
