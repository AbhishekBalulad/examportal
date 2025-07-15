
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Book, Users, Calendar } from "lucide-react";
import { getTopStudentsBySubject } from "@/services/ExamService";
import { ref, get } from 'firebase/database';
import { db } from '@/config/firebase';

type Props = {
  totalExams: number;
  totalAttended: number;
  studentsPassed: number;
  selectedSemester: string;
  selectedSubject: string;
  setSelectedSemester: (v: string) => void;
  setSelectedSubject: (v: string) => void;
  SEMESTERS: string[];
  availableSubjects: string[];
  subjectData: { subject: string; count: number }[];
};

export function DashboardOverview({
  totalExams,
  totalAttended,
  studentsPassed,
  selectedSemester,
  selectedSubject,
  setSelectedSemester,
  setSelectedSubject,
  SEMESTERS,
  availableSubjects,
  subjectData
}: Props) {
  const [topStudents, setTopStudents] = useState<{ name: string; score: number; photo: string }[]>([]);
  
  useEffect(() => {
    const fetchTopStudents = async () => {
      try {
        const result = await getTopStudentsBySubject(selectedSubject);
        if (result.success && result.topStudents) {
          const formattedTopStudents = result.topStudents.map(student => ({
            name: student.name,
            score: student.averageScore,
            photo: student.photo
          }));
          setTopStudents(formattedTopStudents);
        }
      } catch (error) {
        console.error("Error fetching top students:", error);
      }
    };
    
    fetchTopStudents();
  }, [selectedSubject, selectedSemester]);

  // Fix passRate calculation to handle zero values properly
  const passRate = useMemo(() => {
    if (!totalAttended || totalAttended === 0) return 0;
    return Math.round((studentsPassed / totalAttended) * 100);
  }, [studentsPassed, totalAttended]);

  // New chart data for subject distribution
  const subjectDistributionData = useMemo(() => {
    return subjectData.length > 0 ? subjectData : [{ subject: "No Data", count: 1 }];
  }, [subjectData]);

  // Colors for pie chart
  const COLORS = ['#9b87f5', '#33C3F0', '#7E69AB', '#6E59A5', '#a497d7'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center p-6 rounded-2xl shadow bg-gradient-to-br from-[#F1F0FB] to-[#E5DEFF] dark:from-[#222237] dark:to-[#1a1a2e] border-none">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#f4f0fa] dark:bg-[#2d2d45] mb-2 shadow-inner">
            <Book size={28} strokeWidth={1.5} className="text-[#9b87f5]" />
          </div>
          <div className="text-2xl font-semibold text-[#9b87f5]">{totalExams || 0}</div>
          <div className="text-xs text-[#7E69AB] dark:text-[#b9a6eb] mt-1 tracking-wide text-center">
            {selectedSubject === "All" ? "Total Exams" : `${selectedSubject} Exams`}
          </div>
          <div className="mt-2 text-sm text-[#7E69AB] dark:text-[#b9a6eb]">Active Tests</div>
        </Card>

        <Card className="flex flex-col items-center p-6 rounded-2xl shadow bg-gradient-to-br from-[#E7F4FB] to-[#D3E4FD] dark:from-[#1c2636] dark:to-[#162039] border-none">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#e5fafd] dark:bg-[#25364d] mb-2 shadow-inner">
            <Calendar size={28} strokeWidth={1.5} className="text-[#33C3F0]" />
          </div>
          <div className="text-2xl font-semibold text-[#33C3F0]">{totalAttended || 0}</div>
          <div className="text-xs text-[#6E59A5] dark:text-[#8e80c0] mt-1 tracking-wide text-center">Students Attended</div>
          <div className="mt-2 text-sm text-[#6E59A5] dark:text-[#8e80c0]">Active Participation</div>
        </Card>

        <Card className="flex flex-col items-center p-6 rounded-2xl shadow bg-gradient-to-br from-[#EDE7FB] to-[#F1F0FB] dark:from-[#252337] dark:to-[#1e1e30] border-none">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#ede7fb] dark:bg-[#302c51] mb-2 shadow-inner">
            <Users size={26} strokeWidth={1.5} className="text-[#7E69AB]" />
          </div>
          <div className="text-2xl font-semibold text-[#7E69AB]">{passRate}%</div>
          <div className="text-xs text-[#a497d7] mt-1 tracking-wide text-center">Pass Rate</div>
          <div className="mt-2 text-sm text-[#7E69AB] dark:text-[#b9a6eb]">{studentsPassed || 0} Students Passed</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 items-center mt-2">
        <div>
          <label className="block mb-1 text-sm font-semibold">Semester</label>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="border rounded px-4 py-2 bg-background"
          >
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-semibold">Subject</label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="border rounded px-4 py-2 bg-background"
          >
            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border rounded-lg p-4 bg-white dark:bg-card">
          <h2 className="text-lg font-bold mb-4 text-[#7E69AB] dark:text-[#b9a6eb]">Subject Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={subjectDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="subject"
                label={({ subject, percent }) => `${subject}: ${(percent * 100).toFixed(0)}%`}
              >
                {subjectDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value} exams`, props.payload.subject]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-[#7E69AB] dark:text-[#b9a6eb] text-center">
            Exam distribution across subjects
          </div>
        </Card>

        <Card className="border rounded-lg p-4 bg-white dark:bg-card">
          <h2 className="text-lg font-bold mb-4 text-[#7E69AB] dark:text-[#b9a6eb]">Top Performing Students</h2>
          <div className="space-y-4">
            {topStudents.length > 0 ? topStudents.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#F1F0FB] dark:bg-[#252337] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#9b87f5] dark:bg-[#6e5ac7] flex items-center justify-center">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-white text-lg font-semibold">
                          {student.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center rounded-full bg-[#7E69AB] dark:bg-[#5a4889] text-white text-xs font-bold border-2 border-white dark:border-[#222237]">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-[#6E59A5] dark:text-[#b9a6eb]">{student.name}</div>
                    <div className="text-xs text-[#9b87f5] dark:text-[#c3b7f9]">Achievement Score</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[#9b87f5] dark:text-[#c3b7f9] font-bold">{student.score}%</div>
                  <div className={`w-2 h-2 rounded-full ${
                    student.score >= 90 ? 'bg-green-500' :
                    student.score >= 80 ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`} />
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No student data available for this subject
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
