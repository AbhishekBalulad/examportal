import { useState, useEffect, useRef } from "react";
import { Users, Settings, PlusCircle, Upload, BarChart, PieChart, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCard } from "@/components/common/UserCard";
import { StatsCard } from "@/components/common/StatsCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ref, get, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { registerUser } from "@/services/AuthService";
import { uploadToCloudinary } from "@/utils/CloudinaryUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Exam } from '@/services/ExamService';

interface AdminDashboardProps {
  section?: string;
}

export function AdminDashboard({ section }: AdminDashboardProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ 
    name: "", 
    email: "", 
    subjects: [] as string[], 
    password: "",
    department: "",
    profileImage: "" 
  });
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [examSearchQuery, setExamSearchQuery] = useState("");
  const [departmentStats, setDepartmentStats] = useState({
    teachersBySemester: [],
    teachersByDepartment: [],
    studentsBySemester: [],
    studentsByDepartment: [],
    examsByDepartment: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      const teachersRef = ref(db, 'users');
      const departmentsRef = ref(db, 'departments');
      const examsRef = ref(db, 'exams');
      
      const [teachersSnapshot, departmentsSnapshot, examsSnapshot] = await Promise.all([
        get(teachersRef),
        get(departmentsRef),
        get(examsRef)
      ]);
      
      // Process teachers data
      if (teachersSnapshot.exists()) {
        const teachersList: any[] = [];
        const studentsList: any[] = [];
        
        teachersSnapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.role === 'teacher') {
            teachersList.push({
              id: childSnapshot.key,
              ...userData,
              status: 'active',
            });
          } else if (userData.role === 'student') {
            studentsList.push({
              id: childSnapshot.key,
              ...userData,
              status: 'active',
            });
          }
        });
        
        setTeachers(teachersList);
        setStudents(studentsList);
      }

      // Process departments data
      if (departmentsSnapshot.exists()) {
        const departmentsList = Object.entries(departmentsSnapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }));
        setDepartments(departmentsList);
      }
      
      // Process exams data
      if (examsSnapshot.exists()) {
        const examsList = Object.entries(examsSnapshot.val() || {}).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }));
        setExams(examsList);
      }
    };

    fetchData();
  }, []);

  // Update stats when department changes
  useEffect(() => {
    // Generate statistics when selectedDepartment or data changes
    if (departments.length > 0) {
      if (!selectedDepartment && departments[0]) {
        setSelectedDepartment(departments[0].id);
      } else if (selectedDepartment) {
        generateDepartmentStats(selectedDepartment);
      }
    }
  }, [selectedDepartment, departments, teachers, students, exams]);

  // Handle showing appropriate content based on section
  const renderContent = () => {
    // If section is specified, show only that section
    if (section === "teachers") {
      return renderTeachersSection();
    } else if (section === "adminexams") {
      return renderExamsSection();
    }
    
    // Otherwise show the main dashboard with stats
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="dashboard-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Teachers"
            value={teachers.filter(t => !selectedDepartment || t.department === selectedDepartment).length}
            description="Faculty members"
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Active Teachers"
            value={teachers.filter((t) => (t.status === "active") && (!selectedDepartment || t.department === selectedDepartment)).length}
            description="Currently teaching"
            trend="up"
            trendValue="+2 this month"
          />
          <StatsCard
            title="Total Students"
            value={students.filter(s => !selectedDepartment || s.department === selectedDepartment).length}
            description="Enrolled students"
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Teachers by Semester
            </h3>
            <ChartContainer className="h-64" config={{}}>
              <RechartsBarChart
                data={departmentStats.teachersBySemester}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#8884d8" />
              </RechartsBarChart>
            </ChartContainer>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Teachers by Department
            </h3>
            <ChartContainer className="h-64" config={{}}>
              <RechartsPieChart>
                <Pie
                  data={departmentStats.teachersByDepartment.filter(item => item.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {departmentStats.teachersByDepartment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
              </RechartsPieChart>
            </ChartContainer>
          </div>
        </div>
      </>
    );
  };

  // Teacher management section
  const renderTeachersSection = () => {
    return (
      <>
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Manage Teachers</h2>
            <p className="text-muted-foreground">Add, edit or remove teacher accounts</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-64"
            />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                  <DialogDescription>
                    Create a new teacher account. They will receive login credentials via email.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="profileImage">Profile Image</Label>
                    <div className="flex gap-2 items-center">
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center"
                        disabled={uploadingImage}
                      >
                        <Upload className="h-4 w-4 mr-2" /> 
                        {uploadingImage ? 'Uploading...' : profileImageFile ? 'Change Image' : 'Upload Image'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        id="profileImage"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageUpload}
                      />
                    </div>
                    {uploadedImageUrl && (
                      <div className="mt-2">
                        <img 
                          src={uploadedImageUrl} 
                          alt="Profile preview" 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </div>
                    )}
                    {profileImageFile && !uploadedImageUrl && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {profileImageFile.name}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newTeacher.name}
                      onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={newTeacher.department}
                      onValueChange={(value) => handleDepartmentChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Subjects</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {subjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No subjects available for this department</p>
                      ) : (
                        <div className="grid gap-3">
                          {subjects.map((subject) => (
                            <div key={subject.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`subject-${subject.id}`} 
                                checked={newTeacher.subjects.includes(subject.id)}
                                onCheckedChange={() => handleSubjectCheckboxChange(subject.id)}
                              />
                              <label
                                htmlFor={`subject-${subject.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {subject.name} ({subject.semester})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Initial Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newTeacher.password}
                      onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTeacher} disabled={uploadingImage}>Add Teacher</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <UserCard
                key={teacher.id}
                id={teacher.id}
                name={teacher.name}
                email={teacher.email}
                role="teacher"
                status={teacher.status}
                additionalInfo={Array.isArray(teacher.subjects) 
                  ? teacher.subjects.map(sid => subjects.find(s => s.id === sid)?.name).filter(Boolean).join(", ")
                  : subjects.find(s => s.id === teacher.subject)?.name || ""}
                profileImage={teacher.profileImage}
                department={departments.find(d => d.id === teacher.department)?.name}
                onView={handleViewTeacher}
                onEdit={handleEditTeacher}
                onDelete={handleDeleteTeacher}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No teachers found. Add a new teacher to get started.</p>
            </div>
          )}
        </div>
      </>
    );
  };

  // New Exams section
  const renderExamsSection = () => {
    // Get available semesters from the selected department
    const availableSemesters = selectedDepartment ? 
      departments.find(d => d.id === selectedDepartment)?.semesters || [] 
      : [];

    // Filter exams based on selected filters
    const filteredExams = exams.filter(exam => {
      const matchesDepartment = selectedDepartment ? exam.department === selectedDepartment : true;
      const matchesSemester = selectedSemester ? exam.semester === selectedSemester : true;
      const matchesSearch = examSearchQuery.trim() === '' ? true : 
        (exam.title?.toLowerCase().includes(examSearchQuery.toLowerCase()) || 
         exam.subject?.toLowerCase().includes(examSearchQuery.toLowerCase()));
      
      return matchesDepartment && matchesSemester && matchesSearch;
    });

    // Get status badge color
    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'active': return 'bg-green-500';
        case 'scheduled': return 'bg-blue-500';
        case 'draft': return 'bg-gray-500';
        case 'completed': return 'bg-purple-500';
        case 'expired': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Manage Exams</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1">
              <Input
                placeholder="Search exams..."
                value={examSearchQuery}
                onChange={(e) => setExamSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto">
  <Select
    value={selectedDepartment}
    onValueChange={setSelectedDepartment}
  >
    <SelectTrigger className="w-full md:w-[180px]">
      <SelectValue placeholder="Select Department" />
    </SelectTrigger>
    <SelectContent>
      {/* Avoid empty string for value */}
      <SelectItem value={null}>All Departments</SelectItem>
      {departments.map((dept) => (
        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

<div className="w-full md:w-auto">
  <Select
    value={selectedSemester}
    onValueChange={setSelectedSemester}
    disabled={!selectedDepartment}
  >
    <SelectTrigger className="w-full md:w-[180px]">
      <SelectValue placeholder="Select Semester" />
    </SelectTrigger>
    <SelectContent>
      {/* Avoid empty string for value */}
      <SelectItem value={null}>All Semesters</SelectItem>
      {availableSemesters.map((semester) => (
        <SelectItem key={semester} value={semester}>{semester}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

          </div>

          {filteredExams.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => {
                    const departmentName = departments.find(d => d.id === exam.department)?.name || 'Unknown';
                    const submissionsCount = exam.submissions ? Object.keys(exam.submissions).length : 0;
                    
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell>{exam.subject}</TableCell>
                        <TableCell>{departmentName}</TableCell>
                        <TableCell>{exam.semester}</TableCell>
                        <TableCell>{exam.duration} min</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(exam.status)}>{exam.status}</Badge>
                        </TableCell>
                        <TableCell>{submissionsCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/exam/monitor/${exam.id}`}>
                                View
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <p className="text-muted-foreground">No exams found matching the selected filters.</p>
            </div>
          )}
        </div>
      </>
    );
  };

  // Other functions
  const generateDepartmentStats = (departmentId: string) => {
    const selectedDeptData = departments.find(d => d.id === departmentId);
    if (!selectedDeptData) return;

    // Teachers by semester
    const teachersBySemester: any[] = [];
    const semesters = selectedDeptData.semesters || [];
    
    // Initialize with all semesters
    semesters.forEach(semester => {
      teachersBySemester.push({
        name: semester,
        value: 0
      });
    });

    // Count teachers by semester based on their subjects
    teachers.forEach(teacher => {
      if (teacher.department === departmentId) {
        const teacherSubjects = Array.isArray(teacher.subjects) ? teacher.subjects : [teacher.subject];
        
        teacherSubjects.forEach(subjectId => {
          // Find which semester this subject belongs to
          if (selectedDeptData.subjects) {
            Object.entries(selectedDeptData.subjects).forEach(([semester, subjectList]: [string, any]) => {
              if (subjectList.some((s: any) => s.id === subjectId)) {
                const semesterEntry = teachersBySemester.find(item => item.name === semester);
                if (semesterEntry) {
                  semesterEntry.value += 1;
                }
              }
            });
          }
        });
      }
    });

    // Students by semester
    const studentsBySemester = semesters.map(semester => ({
      name: semester,
      value: students.filter(student => student.department === departmentId && student.semester === semester).length
    }));

    // Teachers by department (for comparison)
    const teachersByDepartment = departments.map(dept => ({
      name: dept.name,
      value: teachers.filter(teacher => teacher.department === dept.id).length
    }));

    // Students by department (for comparison)
    const studentsByDepartment = departments.map(dept => ({
      name: dept.name,
      value: students.filter(student => student.department === dept.id).length
    }));

    // Exams by department
    const examsByDepartment = departments.map(dept => ({
      name: dept.name,
      value: exams.filter(exam => exam.department === dept.id).length
    }));

    setDepartmentStats({
      teachersBySemester,
      teachersByDepartment,
      studentsBySemester,
      studentsByDepartment,
      examsByDepartment
    });
  };

  const handleDepartmentChange = async (departmentId: string) => {
    setNewTeacher({ ...newTeacher, department: departmentId, subjects: [] });
    setSelectedDepartment(departmentId);
    
    if (!departmentId) {
      setSubjects([]);
      return;
    }
    
    try {
      const subjectsRef = ref(db, `departments/${departmentId}/subjects`);
      const snapshot = await get(subjectsRef);
      
      if (snapshot.exists()) {
        const allSubjects: any[] = [];
        const subjectsData = snapshot.val();
        
        // Flatten the subjects from all semesters
        Object.entries(subjectsData).forEach(([semester, semesterSubjects]: [string, any]) => {
          semesterSubjects.forEach((subject: any) => {
            allSubjects.push({
              ...subject,
              semester
            });
          });
        });
        
        setSubjects(allSubjects);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfileImageFile(file);
      
      try {
        setUploadingImage(true);
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(file);
        setUploadedImageUrl(imageUrl);
        setNewTeacher({ ...newTeacher, profileImage: imageUrl });
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

  const handleSubjectCheckboxChange = (subjectId: string) => {
    setNewTeacher(prev => {
      const current = [...prev.subjects];
      const index = current.indexOf(subjectId);
      
      if (index === -1) {
        current.push(subjectId);
      } else {
        current.splice(index, 1);
      }
      
      return { ...prev, subjects: current };
    });
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password || !newTeacher.department || newTeacher.subjects.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select at least one subject",
        variant: "destructive",
      });
      return;
    }

    try {
      const { success, user, error } = await registerUser(
        newTeacher.name,
        newTeacher.email,
        newTeacher.password,
        "teacher"
      );

      if (success && user) {
        const departmentRef = ref(db, `departments/${newTeacher.department}/teachers`);
        const snapshot = await get(departmentRef);
        const currentTeachers = snapshot.exists() ? snapshot.val() : [];
        await set(departmentRef, [...currentTeachers, user.id]);

        await set(ref(db, `users/${user.id}`), {
          name: user.name,
          email: user.email,
          role: "teacher",
          subjects: newTeacher.subjects,
          department: newTeacher.department,
          profileImage: newTeacher.profileImage,
        });

        toast({
          title: "Teacher added",
          description: `${newTeacher.name} has been added successfully.`,
        });

        setNewTeacher({ 
          name: "", 
          email: "", 
          subjects: [], 
          password: "",
          department: "",
          profileImage: "" 
        });
        setProfileImageFile(null);
        setUploadedImageUrl("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setIsAddDialogOpen(false);
      } else {
        toast({
          title: "Failed to add teacher",
          description: error || "An error occurred while adding the teacher.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add teacher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewTeacher = (id: string) => {
    const teacher = teachers.find((teacher) => teacher.id === id);
    if (teacher) {
      setSelectedTeacher(teacher);
      setIsViewDialogOpen(true);
    }
  };

  const handleEditTeacher = (id: string) => {
    const teacher = teachers.find((teacher) => teacher.id === id);
    if (teacher) {
      setSelectedTeacher(teacher);
      setNewTeacher({
        name: teacher.name,
        email: teacher.email,
        subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [teacher.subject],
        password: "",
        department: teacher.department,
        profileImage: teacher.profileImage
      });
      setUploadedImageUrl(teacher.profileImage || "");
      setIsEditDialogOpen(true);
      
      if (teacher.department) {
        handleDepartmentChange(teacher.department);
      }
    }
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher || !newTeacher.name || !newTeacher.email || !newTeacher.department || newTeacher.subjects.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select at least one subject",
        variant: "destructive",
      });
      return;
    }

    try {
      const updates: any = {
        name: newTeacher.name,
        email: newTeacher.email,
        subjects: newTeacher.subjects,
        department: newTeacher.department,
      };
      
      if (newTeacher.profileImage) {
        updates.profileImage = newTeacher.profileImage;
      }
      
      // Update user data
      await set(ref(db, `users/${selectedTeacher.id}`), {
        ...selectedTeacher,
        ...updates
      });
      
      // If department changed, update department references
      if (selectedTeacher.department !== newTeacher.department) {
        // Remove from old department
        const oldDeptRef = ref(db, `departments/${selectedTeacher.department}/teachers`);
        const oldSnapshot = await get(oldDeptRef);
        if (oldSnapshot.exists()) {
          const oldTeachers = oldSnapshot.val();
          await set(oldDeptRef, oldTeachers.filter((id: string) => id !== selectedTeacher.id));
        }
        
        // Add to new department
        const newDeptRef = ref(db, `departments/${newTeacher.department}/teachers`);
        const newSnapshot = await get(newDeptRef);
        const newTeachers = newSnapshot.exists() ? newSnapshot.val() : [];
        await set(newDeptRef, [...newTeachers, selectedTeacher.id]);
      }

      toast({
        title: "Teacher updated",
        description: `${newTeacher.name}'s information has been updated.`,
      });

      // Refresh the teachers list
      const teachersRef = ref(db, 'users');
      const teachersSnapshot = await get(teachersRef);
      if (teachersSnapshot.exists()) {
        const teachersList: any[] = [];
        teachersSnapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.role === 'teacher') {
            teachersList.push({
              id: childSnapshot.key,
              ...userData,
              status: 'active',
            });
          }
        });
        setTeachers(teachersList);
      }

      setIsEditDialogOpen(false);
      setSelectedTeacher(null);
      setNewTeacher({ 
        name: "", 
        email: "", 
        subjects: [], 
        password: "",
        department: "",
        profileImage: "" 
      });
      setUploadedImageUrl("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update teacher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const teacher = teachers.find((t) => t.id === id);
      if (teacher && teacher.department) {
        // Remove from department
        const deptRef = ref(db, `departments/${teacher.department}/teachers`);
        const snapshot = await get(deptRef);
        if (snapshot.exists()) {
          const deptTeachers = snapshot.val();
          await set(deptRef, deptTeachers.filter((teacherId: string) => teacherId !== id));
        }
      }
      
      // Delete user
      await set(ref(db, `users/${id}`), null);
      setTeachers(teachers.filter((teacher) => teacher.id !== id));
      
      toast({
        title: "Teacher deleted",
        description: "The teacher has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete teacher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-6">
      {renderContent()}

      {/* View Teacher Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedTeacher.profileImage ? (
                  <img 
                    src={selectedTeacher.profileImage} 
                    alt={`${selectedTeacher.name}'s profile`} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <div className="p-2 bg-muted rounded">{selectedTeacher.name}</div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <div className="p-2 bg-muted rounded">{selectedTeacher.email}</div>
              </div>
              <div className="grid gap-2">
                <Label>Department</Label>
                <div className="p-2 bg-muted rounded">
                  {departments.find(d => d.id === selectedTeacher.department)?.name || "Not assigned"}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Subjects</Label>
                <div className="p-2 bg-muted rounded">
                  {Array.isArray(selectedTeacher.subjects) 
                    ? selectedTeacher.subjects.map(sid => {
                        const subject = subjects.find(s => s.id === sid);
                        return subject ? `${subject.name} (${subject.semester})` : sid;
                      }).join(", ")
                    : subjects.find(s => s.id === selectedTeacher.subject)?.name || selectedTeacher.subject || "Not assigned"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-profileImage">Profile Image</Label>
              <div className="flex gap-2 items-center">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center"
                  disabled={uploadingImage}
                >
                  <Upload className="h-4 w-4 mr-2" /> 
                  {uploadingImage ? 'Uploading...' : 'Change Image'}
                </Button>
                <input
                  ref={fileInputRef}
                  id="edit-profileImage"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageUpload}
                />
              </div>
              {uploadedImageUrl && (
                <div className="mt-2">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Profile preview" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={newTeacher.department}
                onValueChange={(value) => handleDepartmentChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Subjects</Label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                {subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No subjects available for this department</p>
                ) : (
                  <div className="grid gap-3">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`edit-subject-${subject.id}`} 
                          checked={newTeacher.subjects.includes(subject.id)}
                          onCheckedChange={() => handleSubjectCheckboxChange(subject.id)}
                        />
                        <label
                          htmlFor={`edit-subject-${subject.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {subject.name} ({subject.semester})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTeacher} disabled={uploadingImage}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
