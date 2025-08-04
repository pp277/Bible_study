import { useParams } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LessonEditor } from "@/components/admin/lesson-editor";

export default function AdminLessonEdit() {
  const params = useParams();
  const lessonId = params.id === "new" ? undefined : params.id;

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-warm">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LessonEditor lessonId={lessonId} />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
