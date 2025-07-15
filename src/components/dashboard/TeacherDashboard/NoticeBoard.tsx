import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Bell, FileText, X, Edit, Trash2 } from "lucide-react";
import { ref, onValue, push, set, remove, get } from 'firebase/database';
import { db } from '@/config/firebase';
import { toast } from "sonner";
import { format } from "date-fns";
import { fetchAcademicData } from "@/services/AcademicService";

interface Notice {
  id: string;
  title: string;
  description: string;
  semester: string;
  category: string;
  postedBy: string;
  postedByName: string;
  department: string;
  createdAt: string;
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const [noticeData, setNoticeData] = useState({
    title: "",
    description: "",
    semester: "",
    category: "academic"
  });
  const [teacherDepartment, setTeacherDepartment] = useState("");
  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    const user = localStorage.getItem('examUser');
    if (!user) return;
    
    const userData = JSON.parse(user);
    
    const fetchTeacherData = async () => {
      try {
        const teacherRef = ref(db, `users/${userData.id}`);
        const snapshot = await get(teacherRef);
        
        if (snapshot.exists()) {
          const teacherData = snapshot.val();
          const department = teacherData.department || '';
          const name = teacherData.name || userData.name || '';
          
          setTeacherDepartment(department);
          setTeacherName(name);
          
          if (department) {
            await fetchSemestersFromAcademicService(department);
          }
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      }
    };
    
    fetchTeacherData();
    
    const noticesRef = ref(db, 'notices');
    const unsubscribeNotices = onValue(noticesRef, (snapshot) => {
      if (snapshot.exists()) {
        const noticesData: Notice[] = [];
        snapshot.forEach((childSnapshot) => {
          const notice = childSnapshot.val();
          if (notice.department === teacherDepartment || notice.postedBy === userData.id) {
            noticesData.push({
              id: childSnapshot.key || '',
              ...notice
            });
          }
        });
        
        noticesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotices(noticesData);
      } else {
        setNotices([]);
      }
    });
    
    return () => unsubscribeNotices();
  }, []);
  
  const fetchSemestersFromAcademicService = async (department: string) => {
    try {
      console.log("Fetching semesters for department:", department);
      const academicData = await fetchAcademicData(department);
      
      if (academicData && academicData.semesters && academicData.semesters.length > 0) {
        console.log("Semesters fetched from academic service:", academicData.semesters);
        setAvailableSemesters(academicData.semesters);
        
        if (!noticeData.semester) {
          setNoticeData(prev => ({ ...prev, semester: academicData.semesters[0] }));
        }
      } else {
        console.log("No semesters found in academic service, using fallback");
        const fallbackSemesters = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester"];
        setAvailableSemesters(fallbackSemesters);
        setNoticeData(prev => ({ ...prev, semester: fallbackSemesters[0] }));
      }
    } catch (error) {
      console.error("Error in fetchSemestersFromAcademicService:", error);
      
      const fallbackSemesters = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester"];
      setAvailableSemesters(fallbackSemesters);
      setNoticeData(prev => ({ ...prev, semester: fallbackSemesters[0] }));
    }
  };
  
  useEffect(() => {
    if (teacherDepartment) {
      fetchSemestersFromAcademicService(teacherDepartment);
    }
  }, [teacherDepartment]);
  
  const handleAddNotice = () => {
    if (!noticeData.title || !noticeData.description || !noticeData.semester) {
      toast.error("Missing information", {
        description: "Please fill in all required fields"
      });
      return;
    }

    const user = localStorage.getItem('examUser');
    if (!user) {
      toast.error("Authentication error", {
        description: "Please login again"
      });
      return;
    }

    const userData = JSON.parse(user);
    
    try {
      const noticesRef = ref(db, 'notices');
      const newNoticeRef = push(noticesRef);
      
      const newNotice = {
        title: noticeData.title,
        description: noticeData.description,
        semester: noticeData.semester,
        category: noticeData.category,
        postedBy: userData.id,
        postedByName: teacherName,
        department: teacherDepartment,
        createdAt: new Date().toISOString()
      };
      
      set(newNoticeRef, newNotice);
      
      toast.success("Notice added", {
        description: "Your notice has been published successfully",
      });
      
      setNoticeData({
        title: "",
        description: "",
        semester: noticeData.semester,
        category: "academic"
      });
      
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding notice:", error);
      toast.error("Error", {
        description: "Failed to add notice. Please try again."
      });
    }
  };

  const handleEditNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    setNoticeData({
      title: notice.title,
      description: notice.description,
      semester: notice.semester,
      category: notice.category
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdateNotice = () => {
    if (!selectedNotice || !noticeData.title || !noticeData.description || !noticeData.semester) {
      toast.error("Missing information", {
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      const noticeRef = ref(db, `notices/${selectedNotice.id}`);
      
      const updatedNotice = {
        ...selectedNotice,
        title: noticeData.title,
        description: noticeData.description,
        semester: noticeData.semester,
        category: noticeData.category,
        updatedAt: new Date().toISOString()
      };
      
      set(noticeRef, updatedNotice);
      
      toast.success("Notice updated", {
        description: "Your notice has been updated successfully"
      });
      
      setSelectedNotice(null);
      setNoticeData({
        title: "",
        description: "",
        semester: noticeData.semester,
        category: "academic"
      });
      
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error updating notice:", error);
      toast.error("Error", {
        description: "Failed to update notice. Please try again."
      });
    }
  };

  const confirmDeleteNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteNotice = () => {
    if (!selectedNotice) return;
    
    try {
      const noticeRef = ref(db, `notices/${selectedNotice.id}`);
      remove(noticeRef);
      
      toast.success("Notice deleted", {
        description: "The notice has been deleted successfully"
      });
      
      setSelectedNotice(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error("Error", {
        description: "Failed to delete notice. Please try again."
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "exam":
        return <FileText className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "exam":
        return "bg-red-100 text-red-800";
      case "event":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Notice Board</h2>
          <p className="text-muted-foreground">Post important announcements for students</p>
        </div>
        <Button onClick={() => {
          setSelectedNotice(null);
          setNoticeData({
            title: "",
            description: "",
            semester: availableSemesters.length > 0 ? availableSemesters[0] : "",
            category: "academic"
          });
          setIsAddDialogOpen(true);
        }}>
          <Bell className="h-4 w-4 mr-2" />
          Post New Notice
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notices.length > 0 ? (
          notices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{notice.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Badge variant="outline">{notice.semester}</Badge>
                      <Badge className={getCategoryColor(notice.category)} variant="secondary">
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(notice.category)}
                          {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
                        </span>
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditNotice(notice)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDeleteNotice(notice)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{notice.description}</p>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground pt-0 flex justify-between">
                <span>Posted by: {notice.postedByName}</span>
                <span>
                  {notice.createdAt && format(new Date(notice.createdAt), "MMM d, yyyy")}
                </span>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notices posted yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Post Your First Notice
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNotice ? "Edit Notice" : "Post New Notice"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={noticeData.title}
                onChange={(e) => setNoticeData({ ...noticeData, title: e.target.value })}
                placeholder="Notice title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semester">Semester</Label>
              <Select 
                value={noticeData.semester} 
                onValueChange={(value) => setNoticeData({ ...noticeData, semester: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {availableSemesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={noticeData.category} 
                onValueChange={(value) => setNoticeData({ ...noticeData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={noticeData.description}
                onChange={(e) => setNoticeData({ ...noticeData, description: e.target.value })}
                placeholder="Notice content"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={selectedNotice ? handleUpdateNotice : handleAddNotice}>
              {selectedNotice ? "Update Notice" : "Post Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Notice</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this notice? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteNotice}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
