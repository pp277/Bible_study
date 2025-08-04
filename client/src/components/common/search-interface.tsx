import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/context/auth-context";
import { searchLessons, getMains, getClassesByMain } from "@/lib/firebase-service";
import { SearchFilters, Lesson, Main, Class } from "@shared/schema";
import { Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface SearchInterfaceProps {
  onLessonSelect?: (lesson: Lesson) => void;
  showActions?: boolean;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
}

export function SearchInterface({ 
  onLessonSelect, 
  showActions = true, 
  onEdit, 
  onDelete 
}: SearchInterfaceProps) {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Search lessons
  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ["searchLessons", searchQuery, filters],
    queryFn: () => searchLessons(searchQuery, filters),
  });

  // Pagination
  const totalPages = Math.ceil(lessons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLessons = lessons.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search/filters change
  }, [searchQuery, filters]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-success/10 text-success">Published</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
    <Card>
      <CardHeader>
        <CardTitle>Content Search & Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search lessons, references, or content..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select
            value={filters.mainId || ""}
            onValueChange={(value) => handleFilterChange("mainId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Mains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Mains</SelectItem>
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
            value={filters.status || ""}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
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
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Lesson</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 6 : 5} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : currentLessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 6 : 5} className="text-center py-8">
                    <div className="text-gray-500">No lessons found</div>
                  </TableCell>
                </TableRow>
              ) : (
                currentLessons.map((lesson) => (
                  <TableRow 
                    key={lesson.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onLessonSelect?.(lesson)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{lesson.title}</div>
                        <div className="text-sm text-gray-600">
                          Last updated {lesson.updatedAt.toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {lesson.bibleReference || "—"}
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(lesson.category)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lesson.status)}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {lesson.views || 0}
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            asChild
                          >
                            <Link href={`/lessons/${lesson.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {user?.role === "admin" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit?.(lesson);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete?.(lesson);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {Math.min(startIndex + 1, lessons.length)} to {Math.min(endIndex, lessons.length)} of {lessons.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
