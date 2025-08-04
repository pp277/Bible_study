import { useAuthContext } from "@/context/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { StudentDashboard } from "@/components/student/student-dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Home() {
  const { user } = useAuthContext();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-warm">
        <Header />
        <main>
          {user?.role === "admin" ? <AdminDashboard /> : <StudentDashboard />}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
