import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { ImageUpload } from "@/components/common/image-upload";
import { 
  createLesson, 
  updateLesson, 
  getLesson,
  getMains,
  getClassesByMain
} from "@/lib/firebase-service";
import { insertLessonSchema, Main, Class, Lesson } from "@shared/schema";
import { Save, FileText, Eye } from "lucide-react";
import { Link, useLocation } from "wouter";

interface LessonEditorProps {
  lessonId?: string;
  onSave?: (lesson: Lesson) => void;
}

export function LessonEditor({ lessonId, onSave }: LessonEditorProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // Load existing lesson if editing
  const { data: existingLesson } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonId ? getLesson(lessonId) : null,
    enabled: !!lessonId,
  });

  // Load mains for dropdown
  const { data: mains = [] } = useQuery<Main[]>({
    queryKey: ["mains"],
    queryFn: getMains,
  });

  // Load classes when main is selected
  const mainId = useForm().watch("mainId");
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["classes", mainId],
    queryFn: () => mainId ? getClassesByMain(mainId) : Promise.resolve([]),
    enabled: !!mainId,
  });

  const form = useForm({
    resolver: zodResolver(insertLessonSchema),
    defaultValues: {
      title: "",
      mainId: "",
      classId: "",
      bibleReference: "",
      content: "",
      images: [],
      category: "",
      difficulty: "beginner" as const,
      status: "draft" as const,
      order: 0,
    },
  });

  // Set form values when existing lesson loads
  useEffect(() => {
    if (existingLesson) {
      form.reset({
        title: existingLesson.title,
        mainId: existingLesson.mainId,
        classId: existingLesson.classId || "",
        bibleReference: existingLesson.bibleReference || "",
        content: existingLesson.content,
        images: existingLesson.images || [],
        category: existingLesson.category || "",
        difficulty: existingLesson.difficulty || "beginner",
        status: existingLesson.status,
        order: existingLesson.order,
      });
      setContent(existingLesson.content);
      setImages(existingLesson.images || []);
    }
  }, [existingLesson, form]);

  // Sync content with form
  useEffect(() => {
    form.setValue("content", content);
  }, [content, form]);

  // Sync images with form
  useEffect(() => {
    form.setValue("images", images);
  }, [images, form]);

  const createMutation = useMutation({
    mutationFn: (data: any) => createLesson(user!.id, data),
    onSuccess: (lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Lesson created successfully" });
      if (onSave) {
        // Fetch the created lesson and call onSave
        getLesson(lessonId).then(lesson => {
          if (lesson) onSave(lesson);
        });
      } else {
        setLocation(`/lessons/${lessonId}`);
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to create lesson", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateLesson(lessonId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Lesson updated successfully" });
      if (onSave && existingLesson) {
        onSave({ ...existingLesson, ...form.getValues() });
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to update lesson", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = (data: any, status: "draft" | "published") => {
    const lessonData = { ...data, status };
    
    if (lessonId) {
      updateMutation.mutate(lessonData);
    } else {
      createMutation.mutate(lessonData);
    }
  };

  const handleImageUpload = (url: string) => {
    setImages(prev => [...prev, url]);
  };

  const handleImageRemove = (url: string) => {
    setImages(prev => prev.filter(img => img !== url));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{lessonId ? "Edit Lesson" : "Create New Lesson"}</span>
          </CardTitle>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {lessonId && (
              <Button variant="outline" asChild>
                <Link href={`/lessons/${lessonId}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handleSave(form.getValues(), "draft")}
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave(form.getValues(), "published")}
              disabled={isLoading}
            >
              Publish Lesson
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lesson title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bibleReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bible Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Matthew 5:3-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a main category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mains.map((main) => (
                          <SelectItem key={main.id} value={main.id}>
                            {main.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No class</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Select category...</SelectItem>
                        <SelectItem value="New Testament">New Testament</SelectItem>
                        <SelectItem value="Old Testament">Old Testament</SelectItem>
                        <SelectItem value="Christian Living">Christian Living</SelectItem>
                        <SelectItem value="Prayer & Worship">Prayer & Worship</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Content Editor */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Content</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                      placeholder="Write your lesson content here..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div>
              <FormLabel>Images</FormLabel>
              <ImageUpload
                images={images}
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                maxImages={10}
              />
            </div>

            {/* Order */}
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
