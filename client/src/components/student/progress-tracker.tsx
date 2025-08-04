import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/context/auth-context";
import { 
  getUserProgressByUser, 
  getLesson,
  getMain,
  getClass,
  getMains
} from "@/lib/firebase-service";
import { UserProgress, Lesson, Main, Class } from "@shared/schema";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  BookOpen, 
  Search,
  Trophy,
  Target,
  PlayCircle
} from "lucide-react";
import { Link } from "wouter";

export function ProgressTracker() {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "in-progress">("all");
  const [filterMain, setFilterMain] = useState<string>("");

  // Load user progress
  const { data: progressList = [], isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ["userProgress", user?.id],
    queryFn: () => user ? getUserProgressByUser(user.id) : [],
    enabled: !!user,
  });

  // Load lessons for progress entries
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["lessonsForProgress", progressList.map(p => p.lessonId)],
    queryFn: async () => {
      const lessonPromises = progressList.map(progress => getLesson(progress.lessonId));
      const results = await Promise.all(lessonPromises);
      return results.filter(Boolean) as Lesson[];
    },
    enabled: progressList.length > 0,
  });

  // Load mains for filtering
  const { data: mains = [] } = useQuery<Main[]>({
    queryKey: ["mains"],
    queryFn: getMains,
  });

  // Load additional data for lessons
  const { data: lessonData = [] } = useQuery({
    queryKey: ["lessonData", lessons.map(l => l.id)],
    queryFn: async () => {
      const dataPromises = lessons.map(async (lesson) => {
        const main = await getMain(lesson.mainId);
        const cls = lesson.classId ? await getClass(lesson.classId) : null;
        return { lesson, main, cls };
      });
      return Promise.all(dataPromises);
    },
    enabled: lessons.length > 0,
  });

  // Combine progress with lesson data
  const progressWithLessons = progressList.map(progress => {
    const lessonInfo = lessonData.find(data => data.lesson.id === progress.lessonId);
    return {
      progress,
      lesson: lessonInfo?.lesson,
      main: lessonInfo?.main,
      class: lessonInfo?.cls,
    };
  }).filter(item => item.lesson); // Only include items with valid lesson data

  // Filter progress
  const filteredProgress = progressWithLessons.filter(item => {
    const matchesSearch = !searchQuery || 
      item.lesson!.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lesson!.bibleReference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "completed" && item.progress.completed) ||
      (filterStatus === "in-progress" && !item.progress.completed);
    
    const matchesMain = !filterMain || item.lesson!.mainId === filterMain;
    
    return matchesSearch && matchesStatus && matchesMain;
  });

  // Calculate stats
  const getStats = () => {
    const totalLessons = progressList.length;
    const completedLessons = progressList.filter(p => p.completed).length;
    const totalStudyTime = progressList.reduce((total, p) => total + (p.timeSpent || 0), 0);
    const averageProgress = totalLessons > 0 
      ? progressList.reduce((total, p) => total + p.progressPercentage, 0) / totalLessons 
      : 0;
    
    return {
      totalLessons,
      completedLessons,
      totalStudyTime: Math.round(totalStudyTime / 60), // Convert to minutes
      averageProgress: Math.round(averageProgress),
    };
  };

  const stats = getStats();

  const getStatusBadge = (progress: UserProgress) => {
    if (progress.completed) {
      return <Badge className="bg-success/10 text-success">Completed</Badge>;
    }
    if (progress.progressPercentage > 0) {
      return <Badge className="bg-primary/10 text-primary">In Progress</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  const isLoading = progressLoading || lessonsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lessons Started</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalLessons}</p>
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
                <p className="text-3xl font-bold text-gray-900">{stats.completedLessons}</p>
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
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Learning Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Completion</span>
                <span className="text-sm text-gray-600">
                  {stats.completedLessons} of {stats.totalLessons} lessons
                </span>
              </div>
              <Progress 
                value={stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0} 
                className="h-3"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="h-8 w-8 text-accent" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.completedLessons}</p>
                <p className="text-sm text-gray-600">Lessons Completed</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudyTime}</p>
                <p className="text-sm text-gray-600">Minutes Studied</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-8 w-8 text-success" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</p>
                <p className="text-sm text-gray-600">Average Progress</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle>Lesson Progress</CardTitle>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search lessons..."
                  className="pl-10 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMain} onValueChange={setFilterMain}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {mains.map((main) => (
                    <SelectItem key={main.id} value={main.id}>
                      {main.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProgress.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No lessons found matching your filters</p>
              <Button asChild>
                <Link href="/lessons">Browse Lessons</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProgress.map(({ progress, lesson, main, class: cls }) => (
                <Card key={progress.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">{lesson!.title}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {lesson!.bibleReference && (
                                <span className="text-sm text-gray-600">{lesson!.bibleReference}</span>
                              )}
                              {main && (
                                <Badge variant="outline" className="text-xs">{main.title}</Badge>
                              )}
                              {cls && (
                                <Badge variant="outline" className="text-xs">{cls.title}</Badge>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(progress)}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress: {progress.progressPercentage}%</span>
                            {progress.timeSpent && (
                              <span className="text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {Math.round(progress.timeSpent / 60)} min
                              </span>
                            )}
                          </div>
                          <Progress value={progress.progressPercentage} className="h-2" />
                        </div>

                        {progress.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 line-clamp-2">{progress.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/lessons/${lesson!.id}`}>
                            {progress.completed ? "Review" : "Continue"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
