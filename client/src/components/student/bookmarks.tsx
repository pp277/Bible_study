import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthContext } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { 
  getUserBookmarks, 
  getLesson,
  getMain,
  getClass,
  deleteBookmark
} from "@/lib/firebase-service";
import { db } from "@/lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { Bookmark, Lesson, Main, Class } from "@shared/schema";
import { 
  BookmarkCheck, 
  Search, 
  Trash2, 
  Edit,
  BookOpen,
  Eye,
  StickyNote
} from "lucide-react";
import { Link } from "wouter";

export function Bookmarks() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editNotes, setEditNotes] = useState("");

  // Load user bookmarks
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery<Bookmark[]>({
    queryKey: ["bookmarks", user?.id],
    queryFn: () => user ? getUserBookmarks(user.id) : [],
    enabled: !!user,
  });

  // Load lessons for bookmarks
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["lessonsForBookmarks", bookmarks.map(b => b.lessonId)],
    queryFn: async () => {
      const lessonPromises = bookmarks.map(bookmark => getLesson(bookmark.lessonId));
      const results = await Promise.all(lessonPromises);
      return results.filter(Boolean) as Lesson[];
    },
    enabled: bookmarks.length > 0,
  });

  // Load additional data for lessons
  const { data: lessonData = [] } = useQuery({
    queryKey: ["lessonDataForBookmarks", lessons.map(l => l.id)],
    queryFn: async () => {
      const dataPromises = lessons.map(async (lesson) => {
        const main = await getMain(lesson.mainId);
        const cls = lesson.classId ? await getClass(lesson.classId) : null;
        return { lesson, main, cls };
      });
      return Promise.all(dataPromises);
    },
    enabled: lessons.length > 0,
  });

  // Combine bookmarks with lesson data
  const bookmarksWithLessons = bookmarks.map(bookmark => {
    const lessonInfo = lessonData.find(data => data.lesson.id === bookmark.lessonId);
    return {
      bookmark,
      lesson: lessonInfo?.lesson,
      main: lessonInfo?.main,
      class: lessonInfo?.cls,
    };
  }).filter(item => item.lesson); // Only include items with valid lesson data

  // Filter bookmarks
  const filteredBookmarks = bookmarksWithLessons.filter(item => {
    const matchesSearch = !searchQuery || 
      item.lesson!.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lesson!.bibleReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bookmark.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks", user?.id] });
      toast({ title: "Bookmark removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove bookmark", description: error.message, variant: "destructive" });
    },
  });

  // Update bookmark notes mutation
  const updateBookmarkMutation = useMutation({
    mutationFn: async ({ bookmarkId, notes }: { bookmarkId: string; notes: string }) => {
      await updateDoc(doc(db, "bookmarks", bookmarkId), { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks", user?.id] });
      toast({ title: "Notes updated successfully" });
      setEditingBookmark(null);
      setEditNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to update notes", description: error.message, variant: "destructive" });
    },
  });

  const handleDeleteBookmark = (bookmark: Bookmark, lessonTitle: string) => {
    if (confirm(`Remove "${lessonTitle}" from your bookmarks?`)) {
      deleteBookmarkMutation.mutate(bookmark.id);
    }
  };

  const handleEditNotes = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setEditNotes(bookmark.notes || "");
  };

  const handleSaveNotes = () => {
    if (editingBookmark) {
      updateBookmarkMutation.mutate({
        bookmarkId: editingBookmark.id,
        notes: editNotes,
      });
    }
  };

  const isLoading = bookmarksLoading || lessonsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
          <p className="text-gray-600">Lessons you've saved for later reference</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bookmarks..."
              className="pl-10 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookmarks</p>
              <p className="text-3xl font-bold text-gray-900">{bookmarks.length}</p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <BookmarkCheck className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookmarkCheck className="h-5 w-5" />
            <span>Saved Lessons</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <BookmarkCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {bookmarks.length === 0 
                  ? "You haven't bookmarked any lessons yet" 
                  : "No bookmarks match your search"
                }
              </p>
              <Button asChild>
                <Link href="/lessons">Browse Lessons</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBookmarks.map(({ bookmark, lesson, main, class: cls }) => (
                <Card key={bookmark.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1">{lesson!.title}</h3>
                            <div className="flex items-center space-x-2">
                              {lesson!.bibleReference && (
                                <span className="text-sm text-gray-600">{lesson!.bibleReference}</span>
                              )}
                              {main && (
                                <Badge variant="outline" className="text-xs">{main.title}</Badge>
                              )}
                              {cls && (
                                <Badge variant="outline" className="text-xs">{cls.title}</Badge>
                              )}
                              {lesson!.difficulty && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {lesson!.difficulty}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Saved {bookmark.createdAt.toLocaleDateString()}
                          </div>
                        </div>

                        {bookmark.notes && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-primary">
                            <div className="flex items-start space-x-2">
                              <StickyNote className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{bookmark.notes}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/lessons/${lesson!.id}`}>
                              <Eye className="mr-2 h-3 w-3" />
                              View Lesson
                            </Link>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditNotes(bookmark)}
                          >
                            <Edit className="mr-2 h-3 w-3" />
                            {bookmark.notes ? "Edit Notes" : "Add Notes"}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBookmark(bookmark, lesson!.title)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Notes Dialog */}
      <Dialog open={!!editingBookmark} onOpenChange={(open) => !open && setEditingBookmark(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bookmark Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Lesson: {editingBookmark && filteredBookmarks.find(b => b.bookmark.id === editingBookmark.id)?.lesson?.title}
              </label>
              <Textarea
                placeholder="Add your thoughts, questions, or reminders about this lesson..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingBookmark(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveNotes}
                disabled={updateBookmarkMutation.isPending}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
