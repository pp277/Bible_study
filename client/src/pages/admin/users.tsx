import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserManager } from "@/components/admin/user-manager";

export default function AdminUsers() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-warm">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
          <UserManager />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
