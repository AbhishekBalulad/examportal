import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "@/config/firebase";

export interface FullUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  registerNumber?: string;
  departmentId?: string; // raw id
  department?: string;   // resolved name
  adharNumber?: string;
  address?: string;
}

export const getFullCurrentUser = async (): Promise<FullUser | null> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            const userData = snapshot.val();

            let departmentName = "";
            if (userData.department) {
              const deptRef = ref(db, `departments/${userData.department}`);
              const deptSnap = await get(deptRef);
              if (deptSnap.exists()) {
                departmentName = deptSnap.val().name || userData.department;
              } else {
                departmentName = userData.department;
              }
            }

            const fullUser: FullUser = {
              id: firebaseUser.uid,
              ...userData,
              departmentId: userData.department,
              department: departmentName,
            };

            resolve(fullUser);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};
