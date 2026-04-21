import { useEffect, useState } from "react";
import { useToolBox } from "../../../../client/mouse-tool/toolbox/ToolBoxContext";
import { EmbedModal } from "../../../../client/forms/components/EmbedModal";
import { useSelectedNode } from "../../../../client/global-event";

export const EmbedToolBox = () => {
  const { selectedNode } = useSelectedNode();
  const { menus, settings, mouseHandlers } = useToolBox();
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (!selectedNode || selectedNode.getType() !== "embed") {
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

  if (!selectedNode || selectedNode.getType() !== "embed") return null;

  return (
    <EmbedModal
      node={selectedNode}
      open={openModal}
      onClose={handleCloseModal}
      onSubmit={handleCloseModal}
    />
  );
};
