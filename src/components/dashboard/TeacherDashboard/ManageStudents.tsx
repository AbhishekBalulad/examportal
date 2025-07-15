import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { StudentCard } from "./StudentCard";
import { uploadToCloudinary } from "@/utils/CloudinaryUpload";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ManageStudentsProps {
  students: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isAddStudentDialogOpen: boolean;
  setIsAddStudentDialogOpen: (v: boolean) => void;
  newStudent: any;
  setNewStudent: (v: any) => void;
  SEMESTERS: string[];
  handleAddStudent: () => void;
  handleEditStudent: (id: string) => void;
  handleDeleteStudent: (id: string) => void;
  teacherDepartment: string;
}

export function ManageStudents({
  students,
  searchQuery,
  setSearchQuery,
  isAddStudentDialogOpen,
  setIsAddStudentDialogOpen,
  newStudent,
  setNewStudent,
  SEMESTERS,
  handleAddStudent,
  handleEditStudent,
  handleDeleteStudent,
  teacherDepartment
}: ManageStudentsProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  
  const filteredStudents = students.filter(student => 
    student.department === teacherDepartment &&
    (student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.regNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      try {
        setUploadingImage(true);
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(file);
        setNewStudent({ ...newStudent, photo: imageUrl });
        toast({
          title: "Image uploaded",
          description: "Profile image has been uploaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Manage Students</h2>
          <p className="text-muted-foreground">Add, edit or remove student accounts</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:w-64"
          />
          <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a new student account with a unique registration number.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="regNumber">Registration Number</Label>
                  <Input
                    id="regNumber"
                    value={newStudent.regNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, regNumber: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="semester">Semester</Label>
                  <select
                    id="semester"
                    value={newStudent.semester}
                    onChange={e => setNewStudent({ ...newStudent, semester: e.target.value })}
                    className="border rounded px-3 py-2 bg-background"
                  >
                    {SEMESTERS.slice(1).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentPhoto">Profile Image (optional)</Label>
                  <Input
                    id="studentPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {newStudent.photo && (
                    <img src={newStudent.photo} alt="preview" className="h-14 w-14 object-cover rounded mt-1" />
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentPassword">Initial Password</Label>
                  <Input
                    id="studentPassword"
                    type="password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent} disabled={uploadingImage}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={handleEditStudent}
              onDelete={handleDeleteStudent}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">No students found. Add a new student to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
