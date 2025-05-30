import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface DraggableUnitProps {
  id: number;
  name: string;
  code: string;
}

export function DraggableUnit({ id, name, code }: DraggableUnitProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="border p-2 rounded-md cursor-move flex items-center bg-white hover:bg-slate-50"
    >
      <GripVertical className="h-4 w-4 mr-2 text-muted-foreground" />
      <div>
        <div className="font-medium text-sm">{code}</div>
        <div className="text-xs text-muted-foreground truncate">
          {name}
        </div>
      </div>
    </div>
  );
}