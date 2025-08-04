import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Admin() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-warm">
        <Header />
        <main>
          <AdminDashboard />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
