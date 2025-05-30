import { useDroppable } from "@dnd-kit/core";

interface DroppableTimeSlotProps {
  id: string;
  children?: React.ReactNode;
  isOccupied: boolean;
}

export function DroppableTimeSlot({ id, children, isOccupied }: DroppableTimeSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled: isOccupied
  });
  
  return (
    <div
      ref={setNodeRef}
      className={`h-[60px] border-r relative ${
        isOccupied 
          ? 'bg-gray-50 cursor-not-allowed' 
          : isOver 
            ? 'bg-blue-50' 
            : 'bg-white hover:bg-gray-50'
      }`}
    >
      {children}
    </div>
  );
}