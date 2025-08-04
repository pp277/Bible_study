import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Main, 
  InsertMain, 
  Class,
  InsertClass,
  Lesson, 
  InsertLesson, 
  UserProgress, 
  InsertUserProgress,
  Bookmark,
  InsertBookmark,
  SearchFilters
} from "@shared/schema";

// Main CRUD operations
export const createMain = async (userId: string, data: InsertMain): Promise<string> => {
  const mainData = {
    ...data,
    order: data.order || 0,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, "mains"), mainData);
  return docRef.id;
};

export const updateMain = async (id: string, data: Partial<InsertMain>): Promise<void> => {
  await updateDoc(doc(db, "mains", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteMain = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "mains", id));
};

export const getMain = async (id: string): Promise<Main | null> => {
  const docSnap = await getDoc(doc(db, "mains", id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Main;
  }
  return null;
};

export const getMains = async (): Promise<Main[]> => {
  const q = query(collection(db, "mains"), orderBy("order", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Main;
  });
};

// Class CRUD operations
export const createClass = async (userId: string, data: InsertClass): Promise<string> => {
  const classData = {
    ...data,
    order: data.order || 0,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, "classes"), classData);
  return docRef.id;
};

export const updateClass = async (id: string, data: Partial<InsertClass>): Promise<void> => {
  await updateDoc(doc(db, "classes", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteClass = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "classes", id));
};

export const getClass = async (id: string): Promise<Class | null> => {
  const docSnap = await getDoc(doc(db, "classes", id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Class;
  }
  return null;
};

export const getClassesByMain = async (mainId: string): Promise<Class[]> => {
  const q = query(
    collection(db, "classes"), 
    where("mainId", "==", mainId),
    orderBy("order", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Class;
  });
};

// Lesson CRUD operations
export const createLesson = async (userId: string, data: InsertLesson): Promise<string> => {
  const lessonData = {
    ...data,
    order: data.order || 0,
    views: 0,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, "lessons"), lessonData);
  return docRef.id;
};

export const updateLesson = async (id: string, data: Partial<InsertLesson>): Promise<void> => {
  await updateDoc(doc(db, "lessons", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteLesson = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "lessons", id));
};

export const getLesson = async (id: string): Promise<Lesson | null> => {
  const docSnap = await getDoc(doc(db, "lessons", id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Lesson;
  }
  return null;
};

export const incrementLessonViews = async (id: string): Promise<void> => {
  await updateDoc(doc(db, "lessons", id), {
    views: increment(1),
  });
};

export const getLessons = async (filters?: SearchFilters): Promise<Lesson[]> => {
  let q = query(collection(db, "lessons"));

  if (filters?.status) {
    q = query(q, where("status", "==", filters.status));
  }
  if (filters?.mainId) {
    q = query(q, where("mainId", "==", filters.mainId));
  }
  if (filters?.classId) {
    q = query(q, where("classId", "==", filters.classId));
  }
  if (filters?.category) {
    q = query(q, where("category", "==", filters.category));
  }
  if (filters?.difficulty) {
    q = query(q, where("difficulty", "==", filters.difficulty));
  }
  if (filters?.author) {
    q = query(q, where("createdBy", "==", filters.author));
  }

  q = query(q, orderBy("updatedAt", "desc"));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Lesson;
  });
};

export const getPublishedLessons = async (): Promise<Lesson[]> => {
  const q = query(
    collection(db, "lessons"),
    where("status", "==", "published"),
    orderBy("order", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Lesson;
  });
};

// User Progress operations
export const updateUserProgress = async (userId: string, lessonId: string, data: Partial<InsertUserProgress>): Promise<void> => {
  const progressRef = doc(db, "userProgress", `${userId}_${lessonId}`);
  
  const progressData: any = {
    userId,
    lessonId,
    ...data,
  };

  if (data.completed) {
    progressData.completedAt = serverTimestamp();
  }

  await updateDoc(progressRef, progressData);
};

export const createUserProgress = async (data: InsertUserProgress): Promise<void> => {
  const progressRef = doc(db, "userProgress", `${data.userId}_${data.lessonId}`);
  await updateDoc(progressRef, {
    ...data,
    id: `${data.userId}_${data.lessonId}`,
  });
};

export const getUserProgress = async (userId: string, lessonId: string): Promise<UserProgress | null> => {
  const docSnap = await getDoc(doc(db, "userProgress", `${userId}_${lessonId}`));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      completedAt: data.completedAt?.toDate(),
    } as UserProgress;
  }
  return null;
};

export const getUserProgressByUser = async (userId: string): Promise<UserProgress[]> => {
  const q = query(
    collection(db, "userProgress"),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      completedAt: data.completedAt?.toDate(),
    } as UserProgress;
  });
};

// Bookmark operations
export const createBookmark = async (data: InsertBookmark): Promise<string> => {
  const bookmarkData = {
    ...data,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, "bookmarks"), bookmarkData);
  return docRef.id;
};

export const deleteBookmark = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "bookmarks", id));
};

export const getUserBookmarks = async (userId: string): Promise<Bookmark[]> => {
  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Bookmark;
  });
};

export const getBookmarkByUserAndLesson = async (userId: string, lessonId: string): Promise<Bookmark | null> => {
  const q = query(
    collection(db, "bookmarks"),
    where("userId", "==", userId),
    where("lessonId", "==", lessonId),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const data = querySnapshot.docs[0].data();
    return {
      id: querySnapshot.docs[0].id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Bookmark;
  }
  return null;
};

// Search functionality
export const searchLessons = async (searchQuery: string, filters?: SearchFilters): Promise<Lesson[]> => {
  // Note: Firestore doesn't support full-text search natively
  // For production, you'd want to use Algolia or similar service
  // This is a basic implementation that filters after fetching
  
  const lessons = await getLessons(filters);
  
  if (!searchQuery) return lessons;
  
  const query = searchQuery.toLowerCase();
  return lessons.filter(lesson => 
    lesson.title.toLowerCase().includes(query) ||
    lesson.content.toLowerCase().includes(query) ||
    (lesson.bibleReference && lesson.bibleReference.toLowerCase().includes(query)) ||
    (lesson.category && lesson.category.toLowerCase().includes(query))
  );
};
