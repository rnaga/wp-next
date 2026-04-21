import { useDraggableContext } from "./DraggableContext";

export const useDraggable = () => {
  const { draggableElements, registerDraggable } = useDraggableContext();

  return { draggableElements, registerDraggable };
};
