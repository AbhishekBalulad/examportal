
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStudentResults } from "@/services/ExamService";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";
import { db } from "@/config/firebase";
import { format } from "date-fns";
import { Bell } from "lucide-react";

interface AnalysisProps {
  studentId: string;
}

export function Analysis({ studentId }: AnalysisProps) {
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    passedExams: 0,
    averageScore: 0
  });
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [studentDepartment, setStudentDepartment] = useState("");
  const [studentSemester, setStudentSemester] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      const response = await getStudentResults(studentId);
      if (response.success) {
        setResults(response.results);
        
        // Calculate stats
        const completed = response.results.length;
        const passed = response.results.filter((r: any) => r.percentage >= 40).length;
        const avgScore = response.results.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / (completed || 1);
        
        setStats({
          totalExams: completed,
          completedExams: completed,
          passedExams: passed,
          averageScore: Math.round(avgScore)
        });

        // Process subject-wise data
        const subjectScores: { [key: string]: { total: number; count: number } } = {};
        response.results.forEach((result: any) => {
          if (!subjectScores[result.examSubject]) {
            subjectScores[result.examSubject] = { total: 0, count: 0 };
          }
          subjectScores[result.examSubject].total += result.percentage;
          subjectScores[result.examSubject].count += 1;
        });

        const subjectChartData = Object.entries(subjectScores).map(([subject, data]) => ({
          subject,
          averageScore: Math.round(data.total / data.count)
        }));

        setSubjectData(subjectChartData);
      }
    };

    // Get student semester and department for notice filtering
    const studentRef = ref(db, `users/${studentId}`);
    onValue(studentRef, (snapshot) => {
      if (snapshot.exists()) {
        const studentData = snapshot.val();
        setStudentSemester(studentData.semester || '');
        setStudentDepartment(studentData.department || '');
      }
    });

    fetchResults();
  }, [studentId]);

  // Fetch recent notices
  useEffect(() => {
    if (!studentDepartment || !studentSemester) return;
    
    const noticesRef = ref(db, 'notices');
    const recentNoticesQuery = query(noticesRef, orderByChild('createdAt'), limitToLast(3));
    
    const unsubscribeNotices = onValue(recentNoticesQuery, (snapshot) => {
      if (snapshot.exists()) {
        const noticesData: any[] = [];
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
        setNotices(noticesData.slice(0, 3));
      }
    });
    
    return () => unsubscribeNotices();
  }, [studentDepartment, studentSemester]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <p className="text-xs text-muted-foreground">Assigned Exams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedExams}</div>
            <p className="text-xs text-muted-foreground">Exams taken</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passedExams}</div>
            <p className="text-xs text-muted-foreground">Exams passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Your average scores by subject</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[400px] w-full">
              <ChartContainer
                config={{
                  score: {
                    theme: {
                      light: "hsl(var(--primary))",
                      dark: "hsl(var(--primary))",
                    },
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" tick={{ fontSize: 12 }} height={60} tickMargin={10} />
                    <YAxis width={40} />
                    <ChartTooltip />
                    <Bar dataKey="averageScore" fill="hsl(var(--primary))" name="Average Score %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
            <CardDescription>Latest updates from your department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notices.length > 0 ? (
                notices.map((notice) => (
                  <div key={notice.id} className="border-b pb-3 last:border-0">
                    <h4 className="font-medium text-sm">{notice.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notice.description}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-medium">{notice.category}</span>
                      <span className="text-xs text-muted-foreground">
                        {notice.createdAt && format(new Date(notice.createdAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent notices</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
