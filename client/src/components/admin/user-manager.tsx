import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { Users, Shield, UserCheck, Search, Crown, User as UserIcon } from "lucide-react";

export function UserManager() {
  const { user: currentUser } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Load all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate(),
        } as User;
      });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      await updateDoc(doc(db, "users", userId), { role });
    },
    onSuccess: (_, { userId, role }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User role updated",
        description: `User has been ${role === "admin" ? "promoted to admin" : "demoted to user"}.`,
      });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = (user: User, newRole: "admin" | "user") => {
    if (user.id === currentUser?.id && newRole === "user") {
      toast({
        title: "Cannot demote yourself",
        description: "You cannot remove your own admin privileges.",
        variant: "destructive",
      });
      return;
    }

    const action = newRole === "admin" ? "promote" : "demote";
    const actionPast = newRole === "admin" ? "promoted" : "demoted";
    
    if (confirm(`Are you sure you want to ${action} ${user.displayName} ${newRole === "admin" ? "to admin" : "to regular user"}?`)) {
      updateUserRoleMutation.mutate({ userId: user.id, role: newRole });
    }
  };

  const getRoleBadge = (role: string, isCurrentUser: boolean) => {
    if (role === "admin") {
      return (
        <Badge className="bg-secondary/10 text-secondary">
          <Crown className="w-3 h-3 mr-1" />
          Admin {isCurrentUser && "(You)"}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-600">
        <UserIcon className="w-3 h-3 mr-1" />
        User {isCurrentUser && "(You)"}
      </Badge>
    );
  };

  const getStats = () => {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === "admin").length;
    const activeUsers = users.filter(u => u.lastLogin && 
      (new Date().getTime() - u.lastLogin.getTime()) < 30 * 24 * 60 * 60 * 1000 // 30 days
    ).length;

    return { totalUsers, adminCount, activeUsers };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-3xl font-bold text-gray-900">{stats.adminCount}</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active (30 days)</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                className="pl-10 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No users found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const isCurrentUser = user.id === currentUser?.id;
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{user.displayName}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role, isCurrentUser)}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {user.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {user.lastLogin ? user.lastLogin.toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {user.role === "admin" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRoleChange(user, "user")}
                                disabled={isCurrentUser || updateUserRoleMutation.isPending}
                              >
                                Demote to User
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRoleChange(user, "admin")}
                                disabled={updateUserRoleMutation.isPending}
                              >
                                Promote to Admin
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{selectedUser.displayName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <div className="mt-1">
                  {getRoleBadge(selectedUser.role, selectedUser.id === currentUser?.id)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Member Since</label>
                <p className="text-gray-900">{selectedUser.createdAt.toLocaleDateString()}</p>
              </div>
              {selectedUser.lastLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Login</label>
                  <p className="text-gray-900">{selectedUser.lastLogin.toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
