import { useParams } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LessonView } from "@/components/student/lesson-view";

export default function Lesson() {
  const params = useParams();
  const lessonId = params.id;

  if (!lessonId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-warm">
          <Header />
          <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Lesson not found</h1>
              <p className="text-gray-600 mt-2">The lesson you're looking for doesn't exist.</p>
            </div>
          </main>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-warm">
        <Header />
        <main>
          <LessonView lessonId={lessonId} />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
