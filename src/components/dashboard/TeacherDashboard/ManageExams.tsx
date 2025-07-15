import React, { useState } from 'react';
import { createExam } from '@/services/ExamService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// This is a simplified version of the component focused on fixing the current error
// The actual component would have more functionality and UI elements

export function ManageExams() {
  const { toast } = useToast();
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examSemester, setExamSemester] = useState("Semester 1");
  const [examDuration, setExamDuration] = useState("60");
  const [examStartDate, setExamStartDate] = useState("");
  const [examEndDate, setExamEndDate] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isCreateExamDialogOpen, setIsCreateExamDialogOpen] = useState(false);
  const [examSections, setExamSections] = useState([{ id: "section-1", name: "Section 1", timeLimit: 30, questions: [] }]);
  const [teacherDepartment, setTeacherDepartment] = useState("");
  const [minScoreToPass, setMinScoreToPass] = useState(0);
  const [warningsThreshold, setWarningsThreshold] = useState(3);
  const [activeTab, setActiveTab] = useState("details");

  const handleSaveExam = async () => {
    try {
      if (!examTitle || !examSubject || !examDuration) {
        toast({
          title: "Missing information",
          description: "Please fill in all required exam details",
          variant: "destructive"
        });
        setActiveTab("details");
        return;
      }

      if (!examStartDate || !examEndDate) {
        toast({
          title: "Missing dates",
          description: "Please set both start and end dates for the exam",
          variant: "destructive"
        });
        return;
      }

      const startDate = new Date(examStartDate);
      const endDate = new Date(examEndDate);
      
      if (startDate >= endDate) {
        toast({
          title: "Invalid dates",
          description: "End date must be after start date",
          variant: "destructive"
        });
        return;
      }

      if (questions.length === 0) {
        toast({
          title: "No questions",
          description: "Please add at least one question to the exam",
          variant: "destructive"
        });
        setActiveTab("questions");
        return;
      }

      if (selectedStudents.length === 0) {
        toast({
          title: "No students assigned",
          description: "Please assign this exam to at least one student",
          variant: "destructive"
        });
        setActiveTab("students");
        return;
      }

      const user = localStorage.getItem('examUser');
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please login again",
          variant: "destructive"
        });
        return;
      }

      const userData = JSON.parse(user);
      
      const formattedSections = examSections.map(section => {
        const sectionQuestions = questions.filter(q => q.section === section.name);
        return {
          id: section.id,
          name: section.name,
          timeLimit: section.timeLimit,
          questions: sectionQuestions
        };
      });
      
      const examData = {
        title: examTitle,
        subject: examSubject,
        semester: examSemester,
        createdBy: userData.id,
        duration: Number(examDuration),
        status: "scheduled" as "draft" | "scheduled" | "active" | "completed" | "expired",
        questions: questions,
        assignedStudents: selectedStudents,
        sections: formattedSections,
        startDate: examStartDate,
        endDate: examEndDate,
        department: teacherDepartment,
        minScoreToPass: Number(minScoreToPass),
        warningsThreshold: Number(warningsThreshold)
      };

      const result = await createExam(examData);
      
      if (result.success) {
        toast({
          title: "Exam created",
          description: "The exam has been created and assigned successfully",
        });
        
        setExamTitle("");
        setExamSubject("");
        setExamDuration("60");
        setExamStartDate("");
        setExamEndDate("");
        setQuestions([]);
        setSelectedStudents([]);
        setExamSections([{ id: "section-1", name: "Section 1", timeLimit: 30, questions: [] }]);
        setIsCreateExamDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create exam",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: "Failed to create exam. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <Dialog open={isCreateExamDialogOpen} onOpenChange={setIsCreateExamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new exam
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="examTitle">Exam Title</Label>
              <Input
                id="examTitle"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="Enter exam title"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="examSubject">Subject</Label>
              <Select value={examSubject} onValueChange={setExamSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="minScoreToPass">Minimum Score to Pass</Label>
              <Input
                id="minScoreToPass"
                type="number"
                value={minScoreToPass}
                onChange={(e) => setMinScoreToPass(Number(e.target.value))}
                placeholder="Enter minimum score to pass"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="warningsThreshold">Warnings Threshold</Label>
              <Input
                id="warningsThreshold"
                type="number"
                value={warningsThreshold}
                onChange={(e) => setWarningsThreshold(Number(e.target.value))}
                placeholder="Enter warnings threshold"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsCreateExamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveExam}>
              Create Exam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Button onClick={() => setIsCreateExamDialogOpen(true)}>Create Exam</Button>
    </div>
  );
}
