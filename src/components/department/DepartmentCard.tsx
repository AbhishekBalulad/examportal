
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ref, set } from 'firebase/database';
import { db } from '@/config/firebase';
import { Folder, Calendar, Users } from "lucide-react";

interface Department {
  id: string;
  name: string;
  semesters: string[];
  teachers: string[];
}

interface DepartmentCardProps {
  department: Department;
  onUpdate: () => void;
}

export function DepartmentCard({ department, onUpdate }: DepartmentCardProps) {
  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
  const [newSemester, setNewSemester] = useState("");
  const { toast } = useToast();

  const handleAddSemester = async () => {
    if (!newSemester) {
      toast({
        title: "Missing information",
        description: "Please enter a semester name",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedSemesters = [...(department.semesters || []), newSemester];
      await set(ref(db, `departments/${department.id}/semesters`), updatedSemesters);
      
      toast({
        title: "Semester added",
        description: "The semester has been added successfully.",
      });

      setNewSemester("");
      setIsAddSemesterOpen(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add semester. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          {department.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              Semesters
            </h4>
            <div className="space-y-1">
              {department.semesters?.map((semester) => (
                <div key={semester} className="text-sm px-2 py-1 bg-secondary rounded-md text-white">
                  {semester}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              Assigned Teachers
            </h4>
            <div className="text-sm text-muted-foreground">
              {department.teachers?.length || 0} teachers assigned
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => setIsAddSemesterOpen(true)}>
          Add Semester
        </Button>
      </CardFooter>

      <Dialog open={isAddSemesterOpen} onOpenChange={setIsAddSemesterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Semester</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="semester">Semester Name</Label>
              <Input
                id="semester"
                value={newSemester}
                onChange={(e) => setNewSemester(e.target.value)}
                placeholder="e.g., Semester 1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSemesterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSemester}>Add Semester</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
