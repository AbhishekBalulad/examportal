
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Bell, FileText } from "lucide-react";
import { ref, onValue } from 'firebase/database';
import { db } from '@/config/firebase';
import { toast } from "sonner";
import { format } from "date-fns";

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

export function StudentNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [studentSemester, setStudentSemester] = useState("");
  const [studentDepartment, setStudentDepartment] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const user = localStorage.getItem('examUser');
    if (!user) return;
    
    const userData = JSON.parse(user);
    
    // Get student semester and department
    const studentRef = ref(db, `users/${userData.id}`);
    onValue(studentRef, (snapshot) => {
      if (snapshot.exists()) {
        const studentData = snapshot.val();
        setStudentSemester(studentData.semester || '');
        setStudentDepartment(studentData.department || '');
      }
    });
    
    // Get notices
    const noticesRef = ref(db, 'notices');
    const unsubscribeNotices = onValue(noticesRef, (snapshot) => {
      if (snapshot.exists() && studentSemester && studentDepartment) {
        const noticesData: Notice[] = [];
        snapshot.forEach((childSnapshot) => {
          const notice = childSnapshot.val();
          if (notice.department === studentDepartment && 
              (notice.semester === studentSemester || notice.semester === "All Semesters")) {
            noticesData.push({
              id: childSnapshot.key || '',
              ...notice
            });
          }
        });
        
        // Sort notices by created date (latest first)
        noticesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotices(noticesData);
        setFilteredNotices(noticesData);
      } else {
        setNotices([]);
        setFilteredNotices([]);
      }
    });
    
    return () => unsubscribeNotices();
  }, [studentSemester, studentDepartment]);
  
  // Apply filters when category or search changes
  useEffect(() => {
    let filtered = [...notices];
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(notice => notice.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notice => 
        notice.title.toLowerCase().includes(query) || 
        notice.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredNotices(filtered);
  }, [categoryFilter, searchQuery, notices]);

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
      <div>
        <h2 className="text-2xl font-bold mb-2">Notice Board</h2>
        <p className="text-muted-foreground">Important announcements from your department</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="event">Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
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
              <p>No notices available for your semester</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
