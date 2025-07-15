
import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';

interface AcademicData {
  semesters: string[];
  subjects: string[];
  subjectsBySemester: Record<string, string[]>;
}

export const fetchAcademicData = async (departmentId: string): Promise<AcademicData> => {
  try {
    if (!departmentId) {
      console.error('No department ID provided');
      return {
        semesters: [],
        subjects: [],
        subjectsBySemester: {}
      };
    }

    console.log('Fetching academic data for department:', departmentId);
    const departmentRef = ref(db, `departments/${departmentId}`);
    const snapshot = await get(departmentRef);
    
    if (snapshot.exists()) {
      const department = snapshot.val();
      console.log('Department data:', department);
      
      let allSemesters = new Set<string>();
      let allSubjects = new Set<string>();
      const subjectsBySemester: Record<string, string[]> = {};

      // Add semesters
      if (Array.isArray(department.semesters)) {
        department.semesters.forEach((semester: string) => {
          allSemesters.add(semester);
          if (!subjectsBySemester[semester]) {
            subjectsBySemester[semester] = [];
          }
        });
      }

      // Add subjects from each semester
      if (department.subjects) {
        Object.entries(department.subjects).forEach(([semester, semesterSubjects]: [string, any]) => {
          if (Array.isArray(semesterSubjects)) {
            if (!subjectsBySemester[semester]) {
              subjectsBySemester[semester] = [];
            }
            
            semesterSubjects.forEach((subject: any) => {
              if (subject.name) {
                allSubjects.add(subject.name);
                if (!subjectsBySemester[semester].includes(subject.name)) {
                  subjectsBySemester[semester].push(subject.name);
                }
              }
            });
          }
        });
      }

      console.log('Processed academic data:', {
        semesters: Array.from(allSemesters),
        subjects: Array.from(allSubjects),
        subjectsBySemester
      });

      return {
        semesters: Array.from(allSemesters),
        subjects: Array.from(allSubjects),
        subjectsBySemester
      };
    }
    
    console.log('Department not found');
    return {
      semesters: [],
      subjects: [],
      subjectsBySemester: {}
    };
  } catch (error) {
    console.error('Error fetching academic data:', error);
    return {
      semesters: [],
      subjects: [],
      subjectsBySemester: {}
    };
  }
};

export const fetchDepartmentSubjects = async (departmentId: string, semester: string): Promise<string[]> => {
  try {
    if (!departmentId || !semester) {
      console.log('Missing department ID or semester');
      return [];
    }
    
    console.log(`Fetching subjects for department ${departmentId} and semester ${semester}`);
    const departmentRef = ref(db, `departments/${departmentId}/subjects/${semester}`);
    const snapshot = await get(departmentRef);
    
    if (snapshot.exists()) {
      const subjects = snapshot.val();
      console.log('Raw subjects data from DB:', subjects);
      
      if (Array.isArray(subjects)) {
        const subjectNames = subjects.map(subject => subject.name).filter(Boolean);
        console.log('Extracted subject names:', subjectNames);
        return subjectNames;
      }
    }
    
    console.log('No subjects found for this semester');
    return [];
  } catch (error) {
    console.error('Error fetching department subjects:', error);
    return [];
  }
};
