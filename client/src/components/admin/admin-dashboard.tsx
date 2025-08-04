import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Eye,
  FolderPlus,
  Layers,
  UserCog,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";

export function AdminDashboard() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    totalLessons: 0,
    activeStudents: 0,
    completionRate: 0,
    prayerRequests: 0,
  });
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load stats
        const lessonsQuery = query(collection(db, "lessons"));
        const lessonsSnapshot = await getDocs(lessonsQuery);
        
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);

        // Load recent lessons
        const recentLessonsQuery = query(
          collection(db, "lessons"),
          orderBy("updatedAt", "desc"),
          limit(5)
        );
        const recentLessonsSnapshot = await getDocs(recentLessonsQuery);

        setStats({
          totalLessons: lessonsSnapshot.size,
          activeStudents: usersSnapshot.size - 1, // Exclude current admin
          completionRate: 87, // This would be calculated from actual progress data
          prayerRequests: 23, // This would come from a prayer requests collection
        });

        setRecentLessons(
          recentLessonsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        // Mock recent activity for now
        setRecentActivity([
          { id: 1, description: "New user Michael registered", time: "2 minutes ago", type: "user" },
          { id: 2, description: "Sarah completed 'The Good Shepherd'", time: "15 minutes ago", type: "completion" },
          { id: 3, description: "Emma bookmarked 'Faith and Works'", time: "1 hour ago", type: "bookmark" },
          { id: 4, description: "David started 'Psalms Study Series'", time: "2 hours ago", type: "start" },
        ]);

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const quickActions = [
    {
      icon: FolderPlus,
      title: "Create New Main",
      description: "Add a new main curriculum category",
      href: "/admin/mains/new",
      color: "from-primary to-blue-600",
    },
    {
      icon: Layers,
      title: "Create New Class",
      description: "Add a new class under existing main",
      href: "/admin/classes/new",
      color: "from-secondary to-purple-600",
    },
    {
      icon: UserCog,
      title: "Manage Users",
      description: "View and manage user accounts",
      href: "/admin/users",
      color: "from-accent to-orange-600",
    },
    {
      icon: BarChart3,
      title: "View Analytics",
      description: "See detailed usage statistics",
      href: "/admin/analytics",
      color: "from-success to-green-600",
    },
  ];

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
            <p className="text-gray-600">Continue your spiritual journey and manage your content</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild className="bg-primary text-white hover:bg-blue-700">
              <Link href="/admin/lessons/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Lesson
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLessons}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success font-medium">+12%</span>
                <span className="text-gray-500 ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeStudents}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success font-medium">+8%</span>
                <span className="text-gray-500 ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success font-medium">+5%</span>
                <span className="text-gray-500 ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prayer Requests</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.prayerRequests}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">Pending review</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Recent Lessons */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Lessons</CardTitle>
                <Link href="/admin/lessons" className="text-primary hover:text-blue-700 font-medium text-sm">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLessons.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No lessons created yet</p>
                    <Button asChild className="mt-4">
                      <Link href="/admin/lessons/new">Create your first lesson</Link>
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
                          <div className="flex items-center mt-1 space-x-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              lesson.status === "published" 
                                ? "bg-success/10 text-success" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {lesson.status}
                            </span>
                            <span className="text-xs text-gray-500">{lesson.views || 0} views</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/lessons/${lesson.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/lessons/${lesson.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Activities */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    asChild
                  >
                    <Link href={action.href}>
                      <div className={`w-8 h-8 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">{action.title}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === "user" ? "bg-primary" :
                      activity.type === "completion" ? "bg-success" :
                      activity.type === "bookmark" ? "bg-accent" :
                      "bg-secondary"
                    }`}></div>
                    <div>
                      <p className="text-sm text-gray-700">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
