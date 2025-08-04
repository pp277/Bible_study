import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuthContext } from "@/context/auth-context";
import { 
  getPublishedLessons, 
  getMains, 
  getClassesByMain,
  getUserProgress,
  searchLessons
} from "@/lib/firebase-service";
import { Lesson, Main, Class, SearchFilters } from "@shared/schema";
import { 
  BookOpen, 
  Search, 
  Filter,
  PlayCircle,
  CheckCircle,
  Clock,
  Eye
} from "lucide-react";
import { Link } from "wouter";

export default function Lessons() {
  const { user } = useAuthContext();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Load published lessons
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["searchLessons", searchQuery, filters],
    queryFn: () => searchLessons(searchQuery, { ...filters, status: "published" }),
  });

  // Load mains for filter options
  const { data: mains = [] } = useQuery<Main[]>({
    queryKey: ["mains"],
    queryFn: getMains,
  });

  // Load classes when main is selected
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["classes", filters.mainId],
    queryFn: () => filters.mainId ? getClassesByMain(filters.mainId) : Promise.resolve([]),
    enabled: !!filters.mainId,
  });

  // Load user progress for lessons
  const { data: userProgress = {} } = useQuery({
    queryKey: ["userProgressMap", user?.id, lessons.map(l => l.id)],
    queryFn: async () => {
      if (!user) return {};
      const progressMap: Record<string, any> = {};
      await Promise.all(
        lessons.map(async (lesson) => {
          const progress = await getUserProgress(user.id, lesson.id);
          if (progress) {
            progressMap[lesson.id] = progress;
          }
        })
      );
      return progressMap;
    },
    enabled: !!user && lessons.length > 0,
  });

  const handleFilterChange = (key: keyof SearchFilters, value: string | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value || undefined };
      
      // Reset classId when mainId changes
      if (key === "mainId") {
        newFilters.classId = undefined;
      }
      
      return newFilters;
    });
  };

  const getProgressInfo = (lessonId: string) => {
    const progress = userProgress[lessonId];
    if (!progress) return { percentage: 0, status: "not-started" };
    
    if (progress.completed) return { percentage: 100, status: "completed" };
    if (progress.progressPercentage > 0) return { percentage: progress.progressPercentage, status: "in-progress" };
    return { percentage: 0, status: "not-started" };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-primary/10 text-primary">In Progress</Badge>;
      default:
        return <Badge variant="outline">New</Badge>;
    }
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    
    const colorMap: Record<string, string> = {
      "New Testament": "bg-blue-100 text-blue-800",
      "Old Testament": "bg-purple-100 text-purple-800",  
      "Christian Living": "bg-green-100 text-green-800",
      "Prayer & Worship": "bg-orange-100 text-orange-800",
    };

    return (
      <Badge className={colorMap[category] || "bg-gray-100 text-gray-800"}>
        {category}
      </Badge>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-warm">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bible Study Lessons</h1>
            <p className="text-gray-600">Explore our comprehensive curriculum and grow in your faith</p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search lessons, Bible references, or content..."
                    className="pl-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Select
                    value={filters.mainId || ""}
                    onValueChange={(value) => handleFilterChange("mainId", value)}
                  >
                    <SelectTrigger>
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

                  <Select
                    value={filters.classId || ""}
                    onValueChange={(value) => handleFilterChange("classId", value)}
                    disabled={!filters.mainId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.difficulty || ""}
                    onValueChange={(value) => handleFilterChange("difficulty", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.category || ""}
                    onValueChange={(value) => handleFilterChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Topics</SelectItem>
                      <SelectItem value="New Testament">New Testament</SelectItem>
                      <SelectItem value="Old Testament">Old Testament</SelectItem>
                      <SelectItem value="Christian Living">Christian Living</SelectItem>
                      <SelectItem value="Prayer & Worship">Prayer & Worship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div>
            {lessonsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-xl h-64"></div>
                  </div>
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No lessons found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map((lesson) => {
                  const progressInfo = getProgressInfo(lesson.id);
                  
                  return (
                    <Card key={lesson.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                      <div onClick={() => setLocation(`/lessons/${lesson.id}`)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                                {lesson.title}
                              </CardTitle>
                              {lesson.bibleReference && (
                                <p className="text-sm text-gray-600 mt-1 font-serif italic">
                                  {lesson.bibleReference}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(progressInfo.status)}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getCategoryBadge(lesson.category)}
                            {lesson.difficulty && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {lesson.difficulty}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {/* Progress bar for authenticated users */}
                          {user && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{progressInfo.percentage}%</span>
                              </div>
                              <Progress value={progressInfo.percentage} className="h-1.5" />
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500">
                              <Eye className="w-4 h-4 mr-1" />
                              {lesson.views || 0} views
                            </div>
                            
                            <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors">
                              {progressInfo.status === "completed" ? (
                                <>
                                  <CheckCircle className="mr-2 h-3 w-3" />
                                  Review
                                </>
                              ) : progressInfo.status === "in-progress" ? (
                                <>
                                  <PlayCircle className="mr-2 h-3 w-3" />
                                  Continue
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="mr-2 h-3 w-3" />
                                  Start
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Results count */}
          {!lessonsLoading && lessons.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-600">
              Showing {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
