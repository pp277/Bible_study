import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useAuthContext } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { 
  getLesson, 
  getMain, 
  getClass,
  getUserProgress, 
  updateUserProgress, 
  createUserProgress,
  incrementLessonViews,
  createBookmark,
  deleteBookmark,
  getBookmarkByUserAndLesson
} from "@/lib/firebase-service";
import { Lesson, Main, Class } from "@shared/schema";
import { 
  Bookmark, 
  BookmarkCheck, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  Clock,
  StickyNote
} from "lucide-react";
import { Link } from "wouter";

interface LessonViewProps {
  lessonId: string;
}

export function LessonView({ lessonId }: LessonViewProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [studyStartTime] = useState(Date.now());

  // Load lesson
  const { data: lesson, isLoading: lessonLoading } = useQuery<Lesson | null>({
    queryKey: ["lesson", lessonId],
    queryFn: () => getLesson(lessonId),
  });

  // Load main
  const { data: main } = useQuery<Main | null>({
    queryKey: ["main", lesson?.mainId],
    queryFn: () => lesson ? getMain(lesson.mainId) : null,
    enabled: !!lesson,
  });

  // Load class if exists
  const { data: cls } = useQuery<Class | null>({
    queryKey: ["class", lesson?.classId],
    queryFn: () => lesson?.classId ? getClass(lesson.classId) : null,
    enabled: !!lesson?.classId,
  });

  // Load user progress
  const { data: progress } = useQuery({
    queryKey: ["userProgress", user?.id, lessonId],
    queryFn: () => user ? getUserProgress(user.id, lessonId) : null,
    enabled: !!user,
  });

  // Load bookmark status
  const { data: bookmark } = useQuery({
    queryKey: ["bookmark", user?.id, lessonId],
    queryFn: () => user ? getBookmarkByUserAndLesson(user.id, lessonId) : null,
    enabled: !!user,
  });

  // Increment views on mount
  useEffect(() => {
    if (lesson) {
      incrementLessonViews(lessonId);
    }
  }, [lesson, lessonId]);

  // Set initial notes
  useEffect(() => {
    if (progress?.notes) {
      setNotes(progress.notes);
    }
  }, [progress]);

  // Progress update mutation  
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { completed?: boolean; progressPercentage?: number; notes?: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      const studyTime = Math.floor((Date.now() - studyStartTime) / 1000);
      
      if (progress) {
        await updateUserProgress(user.id, lessonId, {
          ...data,
          timeSpent: (progress.timeSpent || 0) + studyTime,
        });
      } else {
        await createUserProgress({
          userId: user.id,
          lessonId,
          completed: data.completed || false,
          progressPercentage: data.progressPercentage || 0,
          timeSpent: studyTime,
          notes: data.notes,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProgress", user?.id, lessonId] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update progress", description: error.message, variant: "destructive" });
    },
  });

  // Bookmark mutations
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      if (bookmark) {
        await deleteBookmark(bookmark.id);
      } else {
        await createBookmark({
          userId: user.id,
          lessonId,
          notes: "",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmark", user?.id, lessonId] });
      toast({ 
        title: bookmark ? "Bookmark removed" : "Lesson bookmarked",
        description: bookmark ? "Removed from your bookmarks" : "Added to your bookmarks"
      });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update bookmark", description: error.message, variant: "destructive" });
    },
  });

  const handleComplete = () => {
    updateProgressMutation.mutate({ 
      completed: true, 
      progressPercentage: 100,
      notes 
    });
    toast({ title: "Lesson completed!", description: "Great job on finishing this lesson." });
  };

  const handleSaveNotes = () => {
    updateProgressMutation.mutate({ notes });
    toast({ title: "Notes saved" });
    setShowNotes(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (lessonLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Lesson not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = progress?.progressPercentage || 0;
  const isCompleted = progress?.completed || false;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 print-friendly">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6 no-print">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {main && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/lessons?main=${main.id}`}>{main.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          {cls && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/lessons?main=${main?.id}&class=${cls.id}`}>{cls.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{lesson.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Lesson Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">{lesson.title}</h1>
            {lesson.bibleReference && (
              <p className="text-lg text-gray-600 font-serif italic">{lesson.bibleReference}</p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              {lesson.category && (
                <Badge variant="outline">{lesson.category}</Badge>
              )}
              {lesson.difficulty && (
                <Badge variant="outline" className="capitalize">{lesson.difficulty}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0 no-print">
            <Button
              variant="outline"
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
            >
              {bookmark ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
              {bookmark ? "Bookmarked" : "Bookmark"}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {user && (
          <div className="no-print">
            <div className="bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress: {progressPercentage}% complete</span>
              {progress?.timeSpent && (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.round(progress.timeSpent / 60)} minutes studied
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lesson Content */}
      <Card className="mb-8">
        <CardContent className="p-8">
          {/* Images */}
          {lesson.images && lesson.images.length > 0 && (
            <div className="mb-8">
              {lesson.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Lesson image ${index + 1}`}
                  className="w-full h-64 object-cover rounded-xl shadow-lg mb-4"
                />
              ))}
            </div>
          )}

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none rich-editor"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </CardContent>
      </Card>

      {/* Notes Section */}
      {user && (
        <Card className="mb-8 no-print">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <StickyNote className="mr-2 h-5 w-5" />
                Personal Notes
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
              >
                {showNotes ? "Hide Notes" : "Add Note"}
              </Button>
            </div>
            
            {showNotes && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your thoughts, questions, or reflections about this lesson..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px]"
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNotes(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNotes} disabled={updateProgressMutation.isPending}>
                    Save Notes
                  </Button>
                </div>
              </div>
            )}
            
            {progress?.notes && !showNotes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{progress.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lesson Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-12 pt-8 border-t border-gray-200 no-print">
        <Button variant="outline" className="mb-4 sm:mb-0" asChild>
          <Link href="/lessons">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Lessons
          </Link>
        </Button>
        
        {user && (
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowNotes(true)}
              disabled={showNotes}
            >
              <StickyNote className="mr-2 h-4 w-4" />
              Add Note
            </Button>
            {!isCompleted && (
              <Button 
                onClick={handleComplete}
                disabled={updateProgressMutation.isPending}
                className="bg-success text-white hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            )}
            {isCompleted && (
              <div className="flex items-center text-success font-medium">
                <CheckCircle className="mr-2 h-4 w-4" />
                Completed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
