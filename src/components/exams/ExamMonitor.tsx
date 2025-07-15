
import { useState, useEffect, ChangeEvent } from 'react';
import { getExamById, getExamSubmissions, getStudentWarnings, updateExamSubmission } from '@/services/ExamService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, Camera, Clock, Timer, CheckCircle, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ref, get } from 'firebase/database';
import { db } from '@/config/firebase';
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";


interface ExamMonitorProps {
  examId?: string;
}

interface Student {
  id: string;
  name: string;
  photo?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  startTime?: string;
  endTime?: string;
  answers?: Record<string, string>;
  warningCount?: number;
  timeTaken?: number;
  warnings?: Array<{
    type: string;
    timestamp: string;
    imageUrl: string;
  }>;
  status: 'completed' | 'in-progress' | 'not-started';
  evaluationComplete?: boolean;
  needsEvaluation?: boolean;
}

export function ExamMonitor({ examId }: ExamMonitorProps) {
  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [warningsDialogOpen, setWarningsDialogOpen] = useState(false);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [studentWarnings, setStudentWarnings] = useState<Array<{
    type: string;
    timestamp: string;
    imageUrl: string;
  }>>([]);
  const [shortAnswers, setShortAnswers] = useState<Array<{
    questionId: string;
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
    points: number;
    score: number;
  }>>([]);
  const [updatedScores, setUpdatedScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId) {
        setError('No exam ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch exam details
        const examResult = await getExamById(examId);
        
        if (!examResult.success || !examResult.exam) {
          setError('Failed to fetch exam');
          setLoading(false);
          return;
        }
        
        setExam(examResult.exam);
        
        // Fetch submissions
        const submissionsResult = await getExamSubmissions(examId);
        
        // Fetch student data
        const studentsRef = ref(db, 'users');
        const studentSnapshot = await get(studentsRef);
        
        const studentsData: Student[] = [];
        const studentProfiles: Record<string, { name: string, photo: string }> = {};
        
        // Get student profile information
        if (studentSnapshot.exists()) {
          studentSnapshot.forEach((childSnapshot) => {
            const studentData = childSnapshot.val();
            if (studentData && studentData.role === 'student') {
              studentProfiles[childSnapshot.key as string] = {
                name: studentData.name || "Unknown Student",
                photo: studentData.photo || ""
              };
            }
          });
        }
        
        // Get assigned students and submissions
        if (examResult.exam.assignedStudents) {
          for (const studentId of examResult.exam.assignedStudents) {
            const submission = submissionsResult.success ? 
              submissionsResult.submissions.find((sub: any) => sub.studentId === studentId) : 
              null;
            
            const studentProfile = studentProfiles[studentId] || { 
              name: `Student ${studentId.slice(-4)}`,
              photo: ""
            };
            
            if (submission) {
              // Student has a submission
              const startTime = new Date(submission.startTime);
              const endTime = new Date(submission.endTime);
              const timeTaken = submission.timeTaken || 
                Math.round((endTime.getTime() - startTime.getTime()) / 60000); // in minutes
              
              studentsData.push({
                id: studentId,
                name: studentProfile.name,
                photo: studentProfile.photo,
                score: submission.score || 0,
                maxScore: submission.maxScore || 0,
                percentage: submission.percentage || 0,
                startTime: startTime.toLocaleString(),
                endTime: endTime.toLocaleString(),
                answers: submission.answers,
                warningCount: submission.warningCount || 0,
                warnings: submission.warnings || [],
                status: 'completed',
                timeTaken: timeTaken,
                evaluationComplete: submission.evaluationComplete !== undefined ? submission.evaluationComplete : true,
                needsEvaluation: submission.needsEvaluation !== undefined ? submission.needsEvaluation : false
              });
            } else {
              // Student hasn't taken the exam
              studentsData.push({
                id: studentId,
                name: studentProfile.name,
                photo: studentProfile.photo,
                status: 'not-started'
              });
            }
          }
        }
        
        setStudents(studentsData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching exam data:', err);
        setError('An error occurred while fetching exam data');
        setLoading(false);
      }
    };
    
    fetchExamData();
  }, [examId]);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleViewWarnings = (student: Student) => {
    setSelectedStudent(student);
    if (student.warnings && student.warnings.length > 0) {
      setStudentWarnings(student.warnings);
      setWarningsDialogOpen(true);
    } else {
      setStudentWarnings([]);
      setWarningsDialogOpen(true);
    }
  };
  
  const handleViewEvaluation = (student: Student) => {
    if (!exam || !exam.questions || !student.answers) return;
    
    setSelectedStudent(student);
    
    // Find short answer questions that need evaluation
    const shortAnswerQuestions = exam.questions.filter((q: any) => q.type === 'short-answer');
    
    if (shortAnswerQuestions.length === 0) {
      toast.info("No short answer questions to evaluate");
      return;
    }
    
    // Prepare short answers for evaluation
    const shortAnswersData = shortAnswerQuestions.map((question: any) => {
      const studentAnswer = student.answers?.[question.id] || '';
      
      return {
        questionId: question.id,
        questionText: question.text,
        studentAnswer: studentAnswer,
        correctAnswer: question.correctAnswer || '',
        points: question.points || 0,
        score: 0 // Will be updated by teacher
      };
    });
    
    // Initialize scores with current values
    const initialScores: Record<string, number> = {};
    shortAnswersData.forEach(qa => {
      initialScores[qa.questionId] = qa.score;
    });
    
    setShortAnswers(shortAnswersData);
    setUpdatedScores(initialScores);
    setEvaluationDialogOpen(true);
  };
  
  const handleScoreChange = (questionId: string, score: number, maxPoints: number) => {
    // Ensure score is within valid range
    const validScore = Math.min(Math.max(0, score), maxPoints);
    setUpdatedScores(prev => ({
      ...prev,
      [questionId]: validScore
    }));
  };
  
  const handleSaveEvaluation = async () => {
    if (!selectedStudent || !examId) return;
    
    try {
      // Calculate the total score including the updated short answer scores
      let totalScore = 0;
      let shortAnswerScore = 0;
      
      // Calculate score from short answers
      shortAnswers.forEach(sa => {
        shortAnswerScore += updatedScores[sa.questionId] || 0;
      });
      
      // Calculate score from other question types (multiple choice, true/false)
      const otherQuestions = exam.questions.filter((q: any) => q.type !== 'short-answer');
      otherQuestions.forEach((question: any) => {
        if (selectedStudent.answers?.[question.id] === question.correctAnswer) {
          totalScore += question.points;
        }
      });
      
      // Add the short answer score to the total
      totalScore += shortAnswerScore;
      
      // Update the submission
      const result = await updateExamSubmission(examId, selectedStudent.id, {
        score: totalScore,
        evaluationComplete: true,
        needsEvaluation: false
      });
      
      if (result.success) {
        toast.success("Evaluation saved successfully");
        
        // Update the local students array with the new score and evaluation status
        setStudents(prev => prev.map(s => {
          if (s.id === selectedStudent.id) {
            return {
              ...s,
              score: totalScore,
              percentage: Math.round((totalScore / (s.maxScore || 1)) * 100),
              evaluationComplete: true,
              needsEvaluation: false
            };
          }
          return s;
        }));
        
        setEvaluationDialogOpen(false);
      } else {
        toast.error("Failed to save evaluation");
      }
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("An error occurred while saving the evaluation");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="ml-2 text-muted-foreground">Loading exam data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!exam) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Exam not found</CardTitle>
          <CardDescription>The exam you're looking for doesn't exist or has been deleted.</CardDescription>
        </CardHeader>
      </Card>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
  <Link
    to="/dashboard/exams"
    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
  >
    <div className="p-2 rounded-full bg-muted hover:bg-muted/60 transition-colors">
      <ArrowLeft className="h-4 w-4" />
    </div>
    Back to Home
  </Link>
</div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{exam.title}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <div>
                    <span className="text-muted-foreground">Subject:</span> {exam.subject}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span> {exam.date}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span> {exam.time}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span> {exam.duration} minutes
                  </div>
                </div>
              </CardDescription>
            </div>
            <Badge className={
              exam.status === 'completed' ? 'bg-green-100 text-green-800' :
              exam.status === 'active' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {exam.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="results">
        <TabsList className="mb-4">
          <TabsTrigger value="results">Exam Results</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
              <CardDescription>
                {students.length} students assigned • {students.filter(s => s.status === 'completed').length} completed
                {students.filter(s => s.needsEvaluation).length > 0 && (
                  <span className="ml-2 text-amber-600">• {students.filter(s => s.needsEvaluation).length} need evaluation</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Student</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-center py-3 px-4">Score</th>
                      <th className="text-center py-3 px-4">Percentage</th>
                      <th className="text-center py-3 px-4">Time Taken</th>
                      <th className="text-center py-3 px-4">Warnings</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                {student.photo ? (
                                  <AvatarImage src={student.photo} alt={student.name} />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {student.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="font-medium">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={
                              student.status === 'completed' ? 'bg-green-100 text-green-800' :
                              student.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {student.status === 'completed' ? 'Completed' :
                               student.status === 'in-progress' ? 'In Progress' :
                               'Not Started'}
                              {student.needsEvaluation && (
                                <span className="ml-2 inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
                              )}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              `${student.score}/${student.maxScore}` : '-'}
                            {student.needsEvaluation && (
                              <span className="text-xs text-amber-600 block">Needs review</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              <span className={`font-medium ${
                                (student.percentage || 0) >= 70 ? 'text-green-600' : 
                                (student.percentage || 0) >= 40 ? 'text-yellow-600' : 
                                'text-red-600'
                              }`}>
                                {student.percentage}%
                              </span> : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              <span className="flex items-center justify-center">
                                <Timer className="h-4 w-4 mr-1 text-primary" />
                                {student.timeTaken} min
                              </span> : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {student.status === 'completed' ? 
                              <span className={`font-medium ${
                                (student.warningCount || 0) > 0 ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                {student.warningCount || 0}
                              </span> : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex justify-center space-x-2">
                              {student.status === 'completed' && (student.warningCount || 0) > 0 && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewWarnings(student)}
                                  className="flex items-center gap-1"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  View
                                </Button>
                              )}
                              {student.status === 'completed' && student.needsEvaluation && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewEvaluation(student)}
                                  className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100"
                                >
                                  <Edit className="h-4 w-4" />
                                  Evaluate
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-muted-foreground">
                          No students found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Exam Statistics</CardTitle>
              <CardDescription>Overall performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Participation</h3>
                  <p className="text-3xl font-bold">
                    {Math.round((students.filter(s => s.status === 'completed').length / students.length) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {students.filter(s => s.status === 'completed').length} of {students.length} students
                  </p>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Average Score</h3>
                  <p className="text-3xl font-bold">
                    {students.filter(s => s.status === 'completed').length > 0
                      ? Math.round(students.filter(s => s.status === 'completed')
                          .reduce((sum, s) => sum + (s.percentage || 0), 0) / 
                          students.filter(s => s.status === 'completed').length)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {students.filter(s => s.percentage && s.percentage >= 40).length} passing students
                  </p>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Average Time</h3>
                  <p className="text-3xl font-bold">
                    {students.filter(s => s.status === 'completed').length > 0
                      ? Math.round(students.filter(s => s.status === 'completed')
                          .reduce((sum, s) => sum + (s.timeTaken || 0), 0) / 
                          students.filter(s => s.status === 'completed').length * 10) / 10
                      : 0} min
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Out of {exam.duration} min allowed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warnings Dialog */}
      <Dialog open={warningsDialogOpen} onOpenChange={setWarningsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Warnings for {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              {studentWarnings.length} warnings detected during the exam
            </DialogDescription>
          </DialogHeader>
          
          {studentWarnings.length > 0 ? (
            <div className="space-y-6 mt-4">
              {studentWarnings.map((warning, index) => (
                <Card key={index} className="border border-amber-200">
                  <CardHeader className="bg-amber-50 py-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <CardTitle className="text-base">{warning.type}</CardTitle>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(warning.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-col items-center">
                      <img 
                        src={warning.imageUrl} 
                        alt={`Warning: ${warning.type}`} 
                        className="rounded-md max-h-64 object-contain mb-2"
                      />
                      <div className="text-sm text-muted-foreground mt-2">
                        Warning {index + 1} of {studentWarnings.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Camera className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-semibold">No warning images available</p>
              <p className="text-sm text-muted-foreground">
                This student has warnings recorded, but no images were captured.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Evaluation Dialog */}
      <Dialog open={evaluationDialogOpen} onOpenChange={setEvaluationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-500" />
              Evaluate Short Answers - {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Review short answer questions and assign scores manually
            </DialogDescription>
          </DialogHeader>
          
          {shortAnswers.length > 0 ? (
            <div className="space-y-6 mt-4">
              {shortAnswers.map((qa, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Question {index + 1}: {qa.questionText}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center">
                        <span className="font-medium">Points: {qa.points}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Correct Answer (Teacher's Reference)</Label>
                      <div className="p-3 bg-muted/20 rounded-md mt-1">
                        {qa.correctAnswer || <span className="text-muted-foreground italic">No reference answer provided</span>}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Student's Answer</Label>
                      <div className="p-3 bg-muted/20 rounded-md mt-1">
                        {qa.studentAnswer || <span className="text-muted-foreground italic">No answer provided</span>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`score-${qa.questionId}`}>Score (out of {qa.points})</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id={`score-${qa.questionId}`}
                          type="number"
                          min={0}
                          max={qa.points}
                          value={updatedScores[qa.questionId] || 0}
                          onChange={(e) => handleScoreChange(qa.questionId, parseInt(e.target.value), qa.points)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">/ {qa.points}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEvaluationDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEvaluation}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Evaluation
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Edit className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-semibold">No short answer questions found</p>
              <p className="text-sm text-muted-foreground">
                This exam doesn't have any short answer questions to evaluate.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
