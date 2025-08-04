import { z } from "zod";

// User schema
export const users = {
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(["admin", "user"]),
  createdAt: z.date(),
  lastLogin: z.date().optional(),
};

export const insertUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  role: z.enum(["admin", "user"]).default("user"),
});

// Main schema (top-level curriculum categories)
export const mains = {
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
};

export const insertMainSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().optional(),
});

// Class schema (optional subcategories under mains)
export const classes = {
  id: z.string(),
  mainId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
};

export const insertClassSchema = z.object({
  mainId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().optional(),
});

// Lesson schema
export const lessons = {
  id: z.string(),
  mainId: z.string(),
  classId: z.string().optional(),
  title: z.string(),
  bibleReference: z.string().optional(),
  content: z.string(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  status: z.enum(["draft", "published", "archived"]),
  order: z.number(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  views: z.number().default(0),
};

export const insertLessonSchema = z.object({
  mainId: z.string(),
  classId: z.string().optional(),
  title: z.string().min(1),
  bibleReference: z.string().optional(),
  content: z.string(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  order: z.number().optional(),
});

// User progress schema
export const userProgress = {
  id: z.string(),
  userId: z.string(),
  lessonId: z.string(),
  completed: z.boolean(),
  completedAt: z.date().optional(),
  progressPercentage: z.number().min(0).max(100),
  timeSpent: z.number().optional(),
  notes: z.string().optional(),
};

export const insertUserProgressSchema = z.object({
  userId: z.string(),
  lessonId: z.string(),
  completed: z.boolean().default(false),
  progressPercentage: z.number().min(0).max(100).default(0),
  timeSpent: z.number().optional(),
  notes: z.string().optional(),
});

// Bookmarks schema
export const bookmarks = {
  id: z.string(),
  userId: z.string(),
  lessonId: z.string(),
  createdAt: z.date(),
  notes: z.string().optional(),
};

export const insertBookmarkSchema = z.object({
  userId: z.string(),
  lessonId: z.string(),
  notes: z.string().optional(),
});

// Search schema for filtering
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  author: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  mainId: z.string().optional(),
  classId: z.string().optional(),
});

// Type exports
export type User = z.infer<typeof insertUserSchema> & { id: string; createdAt: Date; lastLogin?: Date };
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Main = z.infer<typeof insertMainSchema> & { 
  id: string; 
  createdBy: string; 
  createdAt: Date; 
  updatedAt: Date; 
};
export type InsertMain = z.infer<typeof insertMainSchema>;

export type Class = z.infer<typeof insertClassSchema> & { 
  id: string; 
  createdBy: string; 
  createdAt: Date; 
  updatedAt: Date; 
};
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Lesson = z.infer<typeof insertLessonSchema> & { 
  id: string; 
  createdBy: string; 
  createdAt: Date; 
  updatedAt: Date; 
  views: number; 
};
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type UserProgress = z.infer<typeof insertUserProgressSchema> & { 
  id: string; 
  completedAt?: Date; 
};
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type Bookmark = z.infer<typeof insertBookmarkSchema> & { 
  id: string; 
  createdAt: Date; 
};
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type SearchFilters = z.infer<typeof searchFiltersSchema>;
