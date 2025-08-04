import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Bookmarks } from "@/components/student/bookmarks";

export default function BookmarksPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-warm">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Bookmarks />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
