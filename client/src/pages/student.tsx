import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StudentDashboard } from "@/components/student/student-dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Student() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-warm">
        <Header />
        <main>
          <StudentDashboard />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
