import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { 
  getMains, 
  getClassesByMain, 
  createMain, 
  createClass, 
  updateMain, 
  updateClass,
  deleteMain,
  deleteClass
} from "@/lib/firebase-service";
import { insertMainSchema, insertClassSchema, Main, Class } from "@shared/schema";
import { Plus, Edit, Trash2, FolderPlus, Layers } from "lucide-react";

export function ContentManager() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMain, setSelectedMain] = useState<string>("");
  const [editingMain, setEditingMain] = useState<Main | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showMainDialog, setShowMainDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);

  // Load mains
  const { data: mains = [], isLoading: mainsLoading } = useQuery({
    queryKey: ["mains"],
    queryFn: getMains,
  });

  // Load classes for selected main
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes", selectedMain],
    queryFn: () => selectedMain ? getClassesByMain(selectedMain) : Promise.resolve([]),
    enabled: !!selectedMain,
  });

  // Main form
  const mainForm = useForm({
    resolver: zodResolver(insertMainSchema),
    defaultValues: {
      title: "",
      description: "",
      order: 0,
    },
  });

  // Class form
  const classForm = useForm({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      mainId: "",
      title: "",
      description: "",
      order: 0,
    },
  });

  // Main mutations
  const createMainMutation = useMutation({
    mutationFn: (data: any) => createMain(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mains"] });
      toast({ title: "Main created successfully" });
      setShowMainDialog(false);
      mainForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create main", description: error.message, variant: "destructive" });
    },
  });

  const updateMainMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateMain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mains"] });
      toast({ title: "Main updated successfully" });
      setShowMainDialog(false);
      setEditingMain(null);
      mainForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update main", description: error.message, variant: "destructive" });
    },
  });

  const deleteMainMutation = useMutation({
    mutationFn: deleteMain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mains"] });
      toast({ title: "Main deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete main", description: error.message, variant: "destructive" });
    },
  });

  // Class mutations
  const createClassMutation = useMutation({
    mutationFn: (data: any) => createClass(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", selectedMain] });
      toast({ title: "Class created successfully" });
      setShowClassDialog(false);
      classForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create class", description: error.message, variant: "destructive" });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", selectedMain] });
      toast({ title: "Class updated successfully" });
      setShowClassDialog(false);
      setEditingClass(null);
      classForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update class", description: error.message, variant: "destructive" });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", selectedMain] });
      toast({ title: "Class deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete class", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateMain = (data: any) => {
    createMainMutation.mutate(data);
  };

  const handleUpdateMain = (data: any) => {
    if (editingMain) {
      updateMainMutation.mutate({ id: editingMain.id, data });
    }
  };

  const handleCreateClass = (data: any) => {
    createClassMutation.mutate({ ...data, mainId: selectedMain });
  };

  const handleUpdateClass = (data: any) => {
    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass.id, data });
    }
  };

  const handleEditMain = (main: Main) => {
    setEditingMain(main);
    mainForm.reset({
      title: main.title,
      description: main.description || "",
      order: main.order,
    });
    setShowMainDialog(true);
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    classForm.reset({
      mainId: cls.mainId,
      title: cls.title,
      description: cls.description || "",
      order: cls.order,
    });
    setShowClassDialog(true);
  };

  const handleDeleteMain = (main: Main) => {
    if (confirm(`Are you sure you want to delete "${main.title}"? This will also delete all associated classes and lessons.`)) {
      deleteMainMutation.mutate(main.id);
    }
  };

  const handleDeleteClass = (cls: Class) => {
    if (confirm(`Are you sure you want to delete "${cls.title}"? This will also delete all associated lessons.`)) {
      deleteClassMutation.mutate(cls.id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mains Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FolderPlus className="h-5 w-5" />
              <span>Main Categories</span>
            </CardTitle>
            <Dialog open={showMainDialog} onOpenChange={setShowMainDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingMain(null);
                  mainForm.reset();
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Main
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMain ? "Edit Main" : "Create New Main"}</DialogTitle>
                </DialogHeader>
                <Form {...mainForm}>
                  <form onSubmit={mainForm.handleSubmit(editingMain ? handleUpdateMain : handleCreateMain)} className="space-y-4">
                    <FormField
                      control={mainForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter main title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={mainForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={mainForm.control}
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
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowMainDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createMainMutation.isPending || updateMainMutation.isPending}>
                        {editingMain ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {mainsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : mains.length === 0 ? (
            <div className="text-center py-8">
              <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No main categories created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mains.map((main) => (
                <Card key={main.id} className={`cursor-pointer transition-colors ${
                  selectedMain === main.id ? 'ring-2 ring-primary' : 'hover:bg-gray-50'
                }`} onClick={() => setSelectedMain(main.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{main.title}</h3>
                        {main.description && (
                          <p className="text-sm text-gray-600 mt-1">{main.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Order: {main.order}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMain(main);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMain(main);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Classes Section */}
      {selectedMain && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-5 w-5" />
                <span>Classes</span>
              </CardTitle>
              <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingClass(null);
                    classForm.reset({ mainId: selectedMain });
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingClass ? "Edit Class" : "Create New Class"}</DialogTitle>
                  </DialogHeader>
                  <Form {...classForm}>
                    <form onSubmit={classForm.handleSubmit(editingClass ? handleUpdateClass : handleCreateClass)} className="space-y-4">
                      <FormField
                        control={classForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter class title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={classForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={classForm.control}
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
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowClassDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createClassMutation.isPending || updateClassMutation.isPending}>
                          {editingClass ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No classes created for this main yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{cls.title}</h3>
                          {cls.description && (
                            <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">Order: {cls.order}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClass(cls)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClass(cls)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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
      )}
    </div>
  );
}
