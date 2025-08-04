import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Admin from "@/pages/admin";
import Lessons from "@/pages/lessons";
import Lesson from "@/pages/lesson";
import Progress from "@/pages/progress";
import BookmarksPage from "@/pages/bookmarks";
import AdminContent from "@/pages/admin/content";
import AdminLessons from "@/pages/admin/lessons";
import AdminUsers from "@/pages/admin/users";
import AdminLessonEdit from "@/pages/admin/lesson-edit";
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/lessons" component={Lessons} />
      <Route path="/lessons/:id" component={Lesson} />
      <Route path="/progress" component={Progress} />
      <Route path="/bookmarks" component={BookmarksPage} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={Admin} />
      <Route path="/admin/content" component={AdminContent} />
      <Route path="/admin/lessons" component={AdminLessons} />
      <Route path="/admin/lessons/:id/edit" component={AdminLessonEdit} />
      <Route path="/admin/users" component={AdminUsers} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
