import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ContentManager } from "@/components/admin/content-manager";

export default function AdminContent() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-warm">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management</h1>
            <p className="text-gray-600">Organize your curriculum with mains and classes</p>
          </div>
          <ContentManager />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
