import { useDroppableArea } from "./use-droppable-area";

export const DroppableArea = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const { handleDragOver, handleDrop } = useDroppableArea();

  return (
    <div
      style={{
        height: "100%",
        // width: "100dvw",
      }}
      onDragOver={(e) => handleDragOver(e as unknown as DragEvent)}
      onDrop={(e) => handleDrop(e as unknown as DragEvent)}
    >
      {children}
    </div>
  );
};
