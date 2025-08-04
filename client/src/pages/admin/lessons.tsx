import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SearchInterface } from "@/components/common/search-interface";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { deleteLesson } from "@/lib/firebase-service";
import { Lesson } from "@shared/schema";
import { Plus, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function AdminLessons() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchLessons"] });
      toast({ title: "Lesson deleted successfully" });
      setDeletingLesson(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete lesson", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (lesson: Lesson) => {
    setLocation(`/admin/lessons/${lesson.id}/edit`);
  };

  const handleDelete = (lesson: Lesson) => {
    setDeletingLesson(lesson);
  };

  const confirmDelete = () => {
    if (deletingLesson) {
      deleteMutation.mutate(deletingLesson.id);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-warm">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Lesson Management</h1>
              <p className="text-gray-600">Create, edit, and organize your lessons</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button asChild className="bg-primary text-white hover:bg-blue-700">
                <Link href="/admin/lessons/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Lesson
                </Link>
              </Button>
            </div>
          </div>

          <SearchInterface
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
          />

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deletingLesson} onOpenChange={(open) => !open && setDeletingLesson(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to delete "{deletingLesson?.title}"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDeletingLesson(null)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                  >
                    Delete Lesson
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
