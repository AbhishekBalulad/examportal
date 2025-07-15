import { ref, set, get, push, query, orderByChild, equalTo, remove } from 'firebase/database';
import { db } from '../config/firebase';
import { checkUserRole } from './AuthService';
import { uploadToCloudinary, dataURLtoFile } from '@/utils/CloudinaryUpload';

interface ExamSection {
  id: string;
  name: string;
  timeLimit: number;
  questions: Question[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  semester?: string;
  createdBy: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: "draft" | "scheduled" | "active" | "completed" | "expired";
  questions?: Question[];
  sections?: ExamSection[];
  instructions?: string[];
  assignedStudents: string[];
  submissions?: Record<string, Submission>;
  department?: string;
  minScoreToPass: number;
  maxScore?: number;
  warningsThreshold: number;
}

interface Submission {
  examId: string;
  studentId: string;
  studentName?: string;
  studentPhoto?: string;
  answers: Record<string, string>;
  startTime: string;
  endTime: string;
  score: number;
  maxScore: number;
  warningCount: number;
  percentage?: number;
  timeTaken?: number;
  warnings?: Array<{
    type: string;
    timestamp: string;
    imageUrl: string;
  }>;
  sectionScores?: {
    sectionId: string;
    score: number;
    maxScore: number;
  }[];
  evaluationComplete?: boolean;
  needsEvaluation?: boolean;
}

interface Question {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  text: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  section?: string;
  timeLimit?: number;
}

/**
 * Evaluates a short answer by comparing it to the correct answer using keyword matching
 * @param studentAnswer The answer submitted by the student
 * @param correctAnswer The correct answer provided by the teacher
 * @param maxPoints Maximum points for the question
 * @returns Calculated score based on keyword matching
 */
const evaluateShortAnswer = (studentAnswer: string, correctAnswer: string, maxPoints: number): number => {
  if (!studentAnswer) return 0;
  
  // Normalize both answers (lowercase, remove punctuation)
  const normalizeText = (text: string): string => {
    return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  };
  
  const normalizedStudentAnswer = normalizeText(studentAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);
  
  // Get keywords from correct answer (words with 3 or more characters)
  const correctKeywords = normalizedCorrectAnswer
    .split(/\s+/)
    .filter(word => word.length >= 3);
  
  if (correctKeywords.length === 0) return 0;
  
  // Count matching keywords in student answer
  let matchCount = 0;
  correctKeywords.forEach(keyword => {
    if (normalizedStudentAnswer.includes(keyword)) {
      matchCount++;
    }
  });
  
  // Calculate score based on percentage of keywords matched
  const matchPercentage = matchCount / correctKeywords.length;
  
  // Score tiers:
  // 80%+ keywords match = full points
  // 60-79% keywords match = 75% of points
  // 40-59% keywords match = 50% of points
  // 20-39% keywords match = 25% of points
  // Less than 20% = 0 points
  if (matchPercentage >= 0.8) return maxPoints;
  if (matchPercentage >= 0.6) return Math.round(maxPoints * 0.75);
  if (matchPercentage >= 0.4) return Math.round(maxPoints * 0.5);
  if (matchPercentage >= 0.2) return Math.round(maxPoints * 0.25);
  return 0;
};

export const getExamsForTeacher = async (teacherId: string) => {
  try {
    const examsRef = ref(db, 'exams');
    const snapshot = await get(examsRef);
    
    if (snapshot.exists()) {
      const exams: Exam[] = [];
      snapshot.forEach((childSnapshot) => {
        const exam = childSnapshot.val();
        if (exam.createdBy === teacherId) {
          exams.push({ id: childSnapshot.key || '', ...exam });
        }
      });
      return exams;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching teacher exams:', error);
    return [];
  }
};

export const getExamById = async (examId: string) => {
  try {
    const examRef = ref(db, `exams/${examId}`);
    const snapshot = await get(examRef);
    
    if (snapshot.exists()) {
      const examData = snapshot.val();
      return {
        success: true,
        exam: { 
          id: examId,
          ...examData,
          sections: examData.sections.map((section: any, index: number) => ({
            ...section,
            id: `section-${index + 1}`,
            questions: examData.questions.filter((q: any) => q.section === section.name)
          }))
        },
      };
    }
    
    return {
      success: false,
      error: "Exam not found",
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch exam",
    };
  }
};

export const submitExam = async (
  examId: string,
  studentId: string,
  answers: Record<string, string>,
  warningCount: number,
  warnings: Array<{type: string, timestamp: string, imageUrl: string}> = [],
  startTime: string = new Date().toISOString(),
  endTime: string = new Date().toISOString(),
  timeTaken: number = 0
) => {
  try {
    const { success, exam } = await getExamById(examId);
    
    if (!success || !exam) {
      return {
        success: false,
        error: "Exam not found",
      };
    }
    
    const studentRef = ref(db, `users/${studentId}`);
    const studentSnapshot = await get(studentRef);
    const studentData = studentSnapshot.exists() ? studentSnapshot.val() : null;
    const studentName = studentData?.name || `Student ${studentId.slice(-4)}`;
    const studentPhoto = studentData?.photo || "";
    
    let score = 0;
    let maxScore = 0;
    let needsEvaluation = false;
    
    exam.questions.forEach(question => {
      maxScore += question.points;
      
      if (question.type === "short-answer") {

        needsEvaluation = true;
        
        if (question.correctAnswer && typeof question.correctAnswer === 'string' && answers[question.id]) {
          score += evaluateShortAnswer(answers[question.id], question.correctAnswer, question.points);
        }
      } else if (answers[question.id] === question.correctAnswer) {

        score += question.points;
      }
    });
    
    const submission = {
      examId,
      studentId,
      studentName,
      studentPhoto,
      answers,
      startTime,
      endTime,
      timeTaken,
      score,
      maxScore,
      warningCount,
      warnings,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      evaluationComplete: !needsEvaluation,
      needsEvaluation
    };
    
    await set(ref(db, `exams/${examId}/submissions/${studentId}`), submission);
    
    await set(ref(db, `students/${studentId}/exams/${examId}/status`), "completed");
    
    return {
      success: true,
      submission,
    };
  } catch (error) {
    console.error("Error submitting exam:", error);
    return {
      success: false,
      error: "Failed to submit exam",
    };
  }
};

export const getExamsForStudent = async (studentId: string) => {
  try {
    const examsRef = ref(db, 'exams');
    const snapshot = await get(examsRef);
    
    if (snapshot.exists()) {
      const exams: Exam[] = [];
      const currentDate = new Date();
      
      snapshot.forEach((childSnapshot) => {
        const exam = childSnapshot.val();
        if (exam.assignedStudents && exam.assignedStudents.includes(studentId)) {
          const submission = exam.submissions?.[studentId];
          
          const examEndDate = new Date(exam.endDate);
          let currentStatus = exam.status;
          
          if (currentDate > examEndDate) {
            currentStatus = "expired";
            updateExamStatus(childSnapshot.key || '', "expired");
          } else if (currentStatus === "scheduled") {
            const examStartDate = new Date(exam.startDate);
            if (currentDate >= examStartDate && currentDate <= examEndDate) {
              currentStatus = "active";
              updateExamStatus(childSnapshot.key || '', "active");
            }
          }
          
          exams.push({
            ...exam,
            id: childSnapshot.key || '',
            status: submission ? "completed" : currentStatus,
            score: submission?.score,
            maxScore: submission?.maxScore,
          });
        }
      });
      return exams;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching student exams:', error);
    return [];
  }
};

const updateExamStatus = async (examId: string, status: "draft" | "scheduled" | "active" | "completed" | "expired") => {
  try {
    const examRef = ref(db, `exams/${examId}/status`);
    await set(examRef, status);
  } catch (error) {
    console.error('Error updating exam status:', error);
  }
};

export const createExam = async (examData: Omit<Exam, "id">) => {
  try {
    const role = await checkUserRole();
    if (role !== "teacher" && role !== "admin") {
      return {
        success: false,
        error: "Only teachers and admins can create exams",
      };
    }
    
    const examRef = ref(db, 'exams');
    const newExamRef = push(examRef);
    const examId = newExamRef.key;
    
    if (!examId) {
      return {
        success: false,
        error: "Failed to generate exam ID",
      };
    }
    
    await set(newExamRef, examData);
    
    return {
      success: true,
      exam: { id: examId, ...examData },
    };
  } catch (error) {
    console.error('Error creating exam:', error);
    return {
      success: false,
      error: "Failed to create exam",
    };
  }
};

export const getExamSubmissions = async (examId: string) => {
  try {
    const role = await checkUserRole();
    if (role !== "teacher" && role !== "admin") {
      return {
        success: false,
        error: "Only teachers and admins can view submissions",
      };
    }
    
    const submissionsRef = ref(db, `exams/${examId}/submissions`);
    const snapshot = await get(submissionsRef);
    
    if (snapshot.exists()) {
      const submissions: any[] = [];
      
      const usersRef = ref(db, 'users');
      const usersSnapshot = await get(usersRef);
      const users: Record<string, any> = {};
      
      if (usersSnapshot.exists()) {
        usersSnapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.role === 'student') {
            users[childSnapshot.key as string] = {
              name: userData.name || `Student ${(childSnapshot.key as string).slice(-4)}`,
              photo: userData.photo || ""
            };
          }
        });
      }
      
      snapshot.forEach((childSnapshot) => {
        const submissionData = childSnapshot.val();
        const studentId = childSnapshot.key as string;
        
        if (!submissionData.studentName || !submissionData.studentPhoto) {
          submissionData.studentName = users[studentId]?.name || `Student ${studentId.slice(-4)}`;
          submissionData.studentPhoto = users[studentId]?.photo || "";
          
          set(ref(db, `exams/${examId}/submissions/${studentId}/studentName`), submissionData.studentName);
          set(ref(db, `exams/${examId}/submissions/${studentId}/studentPhoto`), submissionData.studentPhoto);
        }
        
        submissions.push({
          studentId,
          ...submissionData
        });
      });
      
      return {
        success: true,
        submissions,
      };
    }
    
    return {
      success: true,
      submissions: [],
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch submissions",
    };
  }
};

export const getStudentResults = async (studentId: string) => {
  try {
    const exams = await getExamsForStudent(studentId);
    const results = exams
      .filter(exam => exam.status === "completed")
      .map(exam => {
        const submissionData = exam.submissions?.[studentId] || {};
        return {
          examId: exam.id,
          examTitle: exam.title,
          examSubject: exam.subject,
          examDate: exam.startDate,
          _questions: exam.questions,
          ...submissionData
        };
      });
    
    return {
      success: true,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch results",
    };
  }
};

export const getTopStudentsBySubject = async (subject: string) => {
  try {
    const examsRef = ref(db, 'exams');
    const studentsRef = ref(db, 'users');
    let examSnapshot, studentSnapshot;
    
    studentSnapshot = await get(studentsRef);
    const students: Record<string, any> = {};
    
    if (studentSnapshot.exists()) {
      studentSnapshot.forEach((childSnapshot) => {
        const student = childSnapshot.val();
        if (student.role === 'student') {
          students[childSnapshot.key as string] = {
            id: childSnapshot.key,
            name: student.name || "Unknown Student",
            email: student.email,
            photo: student.photo || "",
            semester: student.semester
          };
        }
      });
    }
    
    if (subject === "All") {
      examSnapshot = await get(examsRef);
    } else {
      const subjectQuery = query(examsRef, orderByChild('subject'), equalTo(subject));
      examSnapshot = await get(subjectQuery);
    }
    
    if (!examSnapshot.exists()) {
      return {
        success: true,
        topStudents: []
      };
    }
    
    const studentScores: Record<string, { 
      totalScore: number, 
      totalMaxScore: number, 
      examCount: number, 
      name: string,
      photo: string
    }> = {};
    
    examSnapshot.forEach((examSnapshot) => {
      const exam = examSnapshot.val();
      const submissions = exam.submissions || {};
      
      Object.entries(submissions).forEach(([studentId, submission]: [string, any]) => {
        if (!studentScores[studentId]) {
          const studentData = students[studentId] || {};
          studentScores[studentId] = {
            totalScore: 0,
            totalMaxScore: 0,
            examCount: 0,
            name: studentData.name || `Unknown Student`,
            photo: studentData.photo || ""
          };
        }
        
        studentScores[studentId].totalScore += submission.score || 0;
        studentScores[studentId].totalMaxScore += submission.maxScore || 0;
        studentScores[studentId].examCount += 1;
      });
    });
    
    const topStudents = Object.entries(studentScores)
      .map(([studentId, data]) => ({
        id: studentId,
        name: data.name,
        photo: data.photo,
        averageScore: data.totalMaxScore > 0 
          ? Math.round((data.totalScore / data.totalMaxScore) * 100) 
          : 0,
        examCount: data.examCount
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3);
    
    return {
      success: true,
      topStudents
    };
    
  } catch (error) {
    console.error('Error fetching top students:', error);
    return {
      success: false,
      error: "Failed to fetch top students",
      topStudents: []
    };
  }
};

export const getTopStudents = async (examId: string) => {
  try {
    const submissionsResult = await getExamSubmissions(examId);
    
    if (submissionsResult.success) {
      const sortedSubmissions = submissionsResult.submissions
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3)
        .map(submission => ({
          name: submission.studentName || `Student ${submission.studentId.slice(-4)}`,
          photo: submission.studentPhoto || "",
          score: submission.percentage
        }));
      
      return {
        success: true,
        topStudents: sortedSubmissions
      };
    }
    
    return {
      success: false,
      error: "No submissions found",
      topStudents: []
    };
  } catch (error) {
    console.error('Error fetching top students:', error);
    return {
      success: false,
      error: "Failed to fetch top students",
      topStudents: []
    };
  }
};

export const getStudentWarnings = async (examId: string, studentId: string) => {
  try {
    const role = await checkUserRole();
    if (role !== "teacher" && role !== "admin") {
      return {
        success: false,
        error: "Only teachers and admins can view warnings",
      };
    }
    
    const warningsRef = ref(db, `exams/${examId}/submissions/${studentId}/warnings`);
    const snapshot = await get(warningsRef);
    
    if (snapshot.exists()) {
      const warningsData = snapshot.val();
      return {
        success: true,
        warnings: warningsData || [],
      };
    }
    
    return {
      success: true,
      warnings: [],
    };
  } catch (error) {
    console.error('Error fetching student warnings:', error);
    return {
      success: false,
      error: "Failed to fetch warnings",
    };
  }
};

export const captureWarning = async (
  videoElement: HTMLVideoElement | null, 
  warningType: string
): Promise<string | null> => {
  if (!videoElement) {
    console.error("No video element provided for capture");
    return null;
  }
  
  try {
    console.log("Capturing warning image...");
    console.log("Video element status:", {
      readyState: videoElement.readyState,
      paused: videoElement.paused,
      ended: videoElement.ended,
      videoWidth: videoElement.videoWidth,
      videoHeight: videoElement.videoHeight
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    const context = canvas.getContext('2d');
    if (!context) {
      console.error("Could not get canvas context");
      return null;
    }
    
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const file = dataURLtoFile(dataUrl, `warning-${Date.now()}.jpg`);
    
    console.log("Successfully captured image:", file.size, "bytes");
    
    const imageUrl = await uploadToCloudinary(file);
    console.log("Upload complete, returning URL:", imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error("Error capturing warning image:", error);
    return null;
  }
};

// Function to update exam submission (for teacher evaluation)
export const updateExamSubmission = async (examId: string, studentId: string, submissionData: Partial<Submission>) => {
  try {
    const role = await checkUserRole();
    if (role !== "teacher" && role !== "admin") {
      return {
        success: false,
        error: "Only teachers and admins can update submissions",
      };
    }
    
    // Get the current submission
    const submissionRef = ref(db, `exams/${examId}/submissions/${studentId}`);
    const snapshot = await get(submissionRef);
    
    if (!snapshot.exists()) {
      return {
        success: false,
        error: "Submission not found",
      };
    }
    
    // Initialize the current submission with default values for the properties we need
    const currentSubmission = {
      ...(snapshot.val() || {}),
      evaluationComplete: false,
      needsEvaluation: false
    };
    
    // Update only the fields provided in submissionData
    const updatedSubmission = {
      ...currentSubmission,
      ...submissionData,
      // If a score is provided, recalculate the percentage
      percentage: submissionData.score !== undefined ? 
        Math.round((submissionData.score / currentSubmission.maxScore) * 100) : 
        currentSubmission.percentage
    };
    
    await set(submissionRef, updatedSubmission);
    
    return {
      success: true,
      submission: updatedSubmission,
    };
  } catch (error) {
    console.error('Error updating submission:', error);
    return {
      success: false,
      error: "Failed to update submission",
    };
  }
};

export const updateExam = async (examId: string, examData: Partial<Omit<Exam, "id">>) => {
  try {
    const role = await checkUserRole();
    if (role !== "teacher" && role !== "admin") {
      return {
        success: false,
        error: "Only teachers and admins can update exams",
      };
    }
    
    // Get the current exam data
    const examRef = ref(db, `exams/${examId}`);
    const snapshot = await get(examRef);
    
    if (!snapshot.exists()) {
      return {
        success: false,
        error: "Exam not found",
      };
    }
    
    const currentExam = snapshot.val();
    
    // Update only the fields provided in examData
    const updatedExam = {
      ...currentExam,
      ...examData
    };
    
    await set(examRef, updatedExam);
    
    return {
      success: true,
      exam: { id: examId, ...updatedExam },
    };
  } catch (error) {
    console.error('Error updating exam:', error);
    return {
      success: false,
      error: "Failed to update exam",
    };
  }
};

export const deleteExam = async (examId: string) => {
  try {
    const role = await checkUserRole();
    if (role !== "teacher" && role !== "admin") {
      return {
        success: false,
        error: "Only teachers and admins can delete exams",
      };
    }
    
    // Check if the exam has submissions
    const examRef = ref(db, `exams/${examId}`);
    const snapshot = await get(examRef);
    
    if (!snapshot.exists()) {
      return {
        success: false,
        error: "Exam not found",
      };
    }
    
    const examData = snapshot.val();
    
    if (examData.submissions && Object.keys(examData.submissions).length > 0) {
      return {
        success: false,
        error: "Cannot delete an exam with submissions",
      };
    }
    
    // Delete the exam
    await remove(examRef);
    
    return {
      success: true,
      message: "Exam deleted successfully",
    };
  } catch (error) {
    console.error('Error deleting exam:', error);
    return {
      success: false,
      error: "Failed to delete exam",
    };
  }
};

export const getExamWarnings = async (examId: string, studentId: string) => {
  try {
    const role = await checkUserRole();
    if (role !== "teacher" && role !== "admin" && role !== "student") {
      return {
        success: false,
        error: "Unauthorized access",
      };
    }
    
    const warningsRef = ref(db, `exams/${examId}/submissions/${studentId}/warnings`);
    const snapshot = await get(warningsRef);
    
    if (snapshot.exists()) {
      const warningsData = snapshot.val();
      return {
        success: true,
        warnings: warningsData || [],
      };
    }
    
    return {
      success: true,
      warnings: [],
    };
  } catch (error) {
    console.error('Error fetching student warnings:', error);
    return {
      success: false,
      error: "Failed to fetch warnings",
    };
  }
};
