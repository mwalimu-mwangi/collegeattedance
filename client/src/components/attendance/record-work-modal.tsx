import { useState } from "react";
import { UnitSession, Unit, Course, Level } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Clock, MapPin } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecordWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UnitSession | null;
  unit: Unit | null;
  course: Course | null;
  level: Level | null;
}

export function RecordWorkModal({ isOpen, onClose, session, unit, course, level }: RecordWorkModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    topic: "",
    subtopics: "",
    description: "",
    resources: "",
    assignment: "",
    notes: ""
  });
  
  // Fetch existing record if any
  const { data: existingRecord, isLoading } = useQuery({
    queryKey: ["/api/sessions", session?.id, "record"],
    queryFn: async () => {
      if (!session?.id) return null;
      try {
        const res = await fetch(`/api/sessions/${session.id}/record`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch record");
        return res.json();
      } catch (error) {
        // Return null if record doesn't exist yet
        return null;
      }
    },
    enabled: !!session?.id && isOpen,
    onSuccess: (data) => {
      if (data) {
        setFormData({
          topic: data.topic || "",
          subtopics: data.subtopics || "",
          description: data.description || "",
          resources: data.resources || "",
          assignment: data.assignment || "",
          notes: data.notes || ""
        });
      }
    }
  });
  
  // Create or update record
  const recordMutation = useMutation({
    mutationFn: async (recordData: any) => {
      if (existingRecord) {
        // Update existing record
        const res = await apiRequest("PATCH", `/api/record-of-work/${existingRecord.id}`, recordData);
        return res.json();
      } else {
        // Create new record
        const res = await apiRequest("POST", "/api/record-of-work", {
          ...recordData,
          sessionId: session?.id
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session?.id, "record"] });
      toast({
        title: existingRecord ? "Record updated" : "Record created",
        description: `Your record of work has been ${existingRecord ? "updated" : "saved"} successfully.`
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save record",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordMutation.mutate(formData);
  };
  
  if (!isOpen || !session || !unit || !course || !level) return null;
  
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-medium text-lg">Record of Work - {unit.name}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-slate-500">{course.name} - {level.name}</p>
            <div className="flex items-center mt-1 text-sm text-slate-600">
              <Clock className="text-slate-400 mr-1" size={16} />
              {format(startTime, "PP")} ({format(startTime, "hh:mm a")} - {format(endTime, "hh:mm a")})
              <span className="mx-2 text-slate-300">|</span>
              <MapPin className="text-slate-400 mr-1" size={16} />
              {session.location || "TBD"}
            </div>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="topic" className="mb-1">Topic Covered</Label>
            <Input
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g. Introduction to SQL Queries"
              required
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="subtopics" className="mb-1">Subtopics</Label>
            <Input
              id="subtopics"
              name="subtopics"
              value={formData.subtopics}
              onChange={handleChange}
              placeholder="e.g. SELECT, WHERE, JOIN statements"
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="description" className="mb-1">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what was covered in the session..."
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="resources" className="mb-1">Resources Used</Label>
            <Input
              id="resources"
              name="resources"
              value={formData.resources}
              onChange={handleChange}
              placeholder="e.g. Slides, Textbook Chapter 5, Online Examples"
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="assignment" className="mb-1">Assignment/Homework (Optional)</Label>
            <Textarea
              id="assignment"
              name="assignment"
              rows={2}
              value={formData.assignment}
              onChange={handleChange}
              placeholder="Any homework or assignments given..."
            />
          </div>
          
          <div>
            <Label htmlFor="notes" className="mb-1">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes or observations..."
            />
          </div>
        </form>
        
        <div className="p-4 border-t border-slate-200 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            className="bg-primary-800 hover:bg-primary-900" 
            onClick={handleSubmit}
            disabled={recordMutation.isPending}
          >
            {existingRecord ? "Update Record" : "Save Record"}
          </Button>
        </div>
      </div>
    </div>
  );
}
