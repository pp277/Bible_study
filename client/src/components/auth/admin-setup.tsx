import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle } from "lucide-react";

export function AdminSetup() {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-xl">Admin Account Setup</CardTitle>
        <CardDescription>
          First user automatically becomes administrator
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Admin Access Granted</p>
            <p className="text-xs text-green-700">You can manage content and users</p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Admin
          </Badge>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          <p>As the first user, you have been granted administrator privileges.</p>
          <p className="mt-2">You can promote other users to admin from the Admin panel.</p>
        </div>
      </CardContent>
    </Card>
  );
}