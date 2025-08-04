import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Bookmark,
  TrendingUp,
  PlayCircle,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";

export function StudentDashboard() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    lessonsStarted: 0,
    lessonsCompleted: 0,
    totalStudyTime: 0,
    bookmarksCount: 0,
    currentStreak: 7,
  });
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [recommendedLessons, setRecommendedLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        // Load user progress
        const progressQuery = query(
          collection(db, "userProgress"),
          where("userId", "==", user.id)
        );
        const progressSnapshot = await getDocs(progressQuery);
        
        let lessonsStarted = 0;
        let lessonsCompleted = 0;
        let totalStudyTime = 0;

        progressSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.progressPercentage > 0) lessonsStarted++;
          if (data.completed) lessonsCompleted++;
          totalStudyTime += data.timeSpent || 0;
        });

        // Load bookmarks count
        const bookmarksQuery = query(
          collection(db, "bookmarks"),
          where("userId", "==", user.id)
        );
        const bookmarksSnapshot = await getDocs(bookmarksQuery);

        // Load recent lessons (published lessons)
        const lessonsQuery = query(
          collection(db, "lessons"),
          where("status", "==", "published"),
          orderBy("createdAt", "desc"),
          limit(6)
        );
        const lessonsSnapshot = await getDocs(lessonsQuery);

        setStats({
          lessonsStarted,
          lessonsCompleted,
          totalStudyTime: Math.round(totalStudyTime / 60), // Convert to minutes
          bookmarksCount: bookmarksSnapshot.size,
          currentStreak: 7, // This would be calculated based on daily activity
        });

        const lessons = lessonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRecentLessons(lessons.slice(0, 3));
        setRecommendedLessons(lessons.slice(3, 6));

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const completionPercentage = stats.lessonsStarted > 0 
    ? Math.round((stats.lessonsCompleted / stats.lessonsStarted) * 100)
    : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.displayName?.split(' ')[0]}
            </h2>
            <p className="text-gray-600">Continue your spiritual journey</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild className="bg-primary text-white hover:bg-blue-700">
              <Link href="/lessons">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Lessons
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lessons Started</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.lessonsStarted}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <PlayCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.lessonsCompleted}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Study Time</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalStudyTime}m</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bookmarks</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.bookmarksCount}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Bookmark className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.currentStreak}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Completion</span>
                  <span className="text-sm text-gray-600">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.lessonsStarted}</p>
                  <p className="text-sm text-gray-600">Lessons in Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{stats.lessonsCompleted}</p>
                  <p className="text-sm text-gray-600">Lessons Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{stats.totalStudyTime}</p>
                  <p className="text-sm text-gray-600">Minutes Studied</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Continue Learning */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Continue Learning</CardTitle>
              <Link href="/progress" className="text-primary hover:text-blue-700 font-medium text-sm">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLessons.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No lessons started yet</p>
                  <Button asChild className="mt-4">
                    <Link href="/lessons">Start your first lesson</Link>
                  </Button>
                </div>
              ) : (
                recentLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                        <p className="text-sm text-gray-600">{lesson.bibleReference}</p>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: "65%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/lessons/${lesson.id}`}>
                        Continue
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommended */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recommended for You</CardTitle>
              <Link href="/lessons" className="text-primary hover:text-blue-700 font-medium text-sm">
                Browse All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedLessons.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recommendations available</p>
                </div>
              ) : (
                recommendedLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent to-orange-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                        <p className="text-sm text-gray-600">{lesson.bibleReference}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {lesson.difficulty || "beginner"} • {lesson.category || "General"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/lessons/${lesson.id}`}>
                        Start
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
