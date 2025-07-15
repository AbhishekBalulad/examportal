
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudentCardProps {
  student: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  return (
    <div className="rounded-2xl shadow-lg relative bg-gradient-to-br from-[#F1F0FB] to-[#E5DEFF] p-6 flex flex-col items-center border-2 border-[#9b87f5]/30 hover:scale-105 transition-transform min-h-[240px]">
      <div className="relative -mt-10 mb-2">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-2 border-[#9b87f5] shadow-lg">
          {student.photo ? (
            <img src={student.photo} alt={student.name} className="w-20 h-20 object-cover rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#E5DEFF] flex items-center justify-center text-[#9b87f5] text-3xl">
              {student.name?.charAt(0) ?? "?"}
            </div>
          )}
          <span className="absolute bottom-[-8px] right-[0px] bg-gradient-to-br from-[#7E69AB] to-[#9b87f5] text-white text-xs px-2 py-0.5 rounded-full shadow font-bold">
            {student.semester}
          </span>
        </div>
      </div>
      <div className="pt-2 text-center w-full">
        <h3 className="font-bold text-lg text-[#403E43]">{student.name}</h3>
        <p className="text-[#8A898C] text-sm">{student.email}</p>
        <p className="text-xs mt-1 text-[#7E69AB]">{student.regNumber}</p>
      </div>
      <div className="mt-4 flex justify-center gap-3 w-full">
        <Button 
          className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white text-xs px-4 py-1.5 rounded-lg font-semibold transition"
          onClick={() => onEdit(student.id)}
        >
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              className="bg-[#ea384c] hover:bg-[#cf2840] text-white text-xs px-4 py-1.5 rounded-lg font-semibold transition"
            >
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {student.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(student.id)}
                className="bg-exam-danger hover:bg-exam-danger/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
