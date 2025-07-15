
import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/config/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export function Support() {
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const supportRef = ref(db, "support");
    
    const unsubscribe = onValue(supportRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const requestsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        setSupportRequests(requestsArray);
      } else {
        setSupportRequests([]);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (requestId: string, status: "pending" | "in-progress" | "resolved") => {
    try {
      const requestRef = ref(db, `support/${requestId}`);
      await update(requestRef, { status, updatedAt: new Date().toISOString() });
      
      toast({
        title: "Status updated",
        description: `Request marked as ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update request status.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500"><AlertCircle className="h-3 w-3 mr-1" /> In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Unknown date";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const pendingRequests = supportRequests.filter(req => req.status === "pending");
  const inProgressRequests = supportRequests.filter(req => req.status === "in-progress");
  const resolvedRequests = supportRequests.filter(req => req.status === "resolved");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="ml-2 text-muted-foreground">Loading support requests...</p>
      </div>
    );
  }

  const renderRequestCard = (request: any) => (
    <Card key={request.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg">{request.name}</CardTitle>
            <CardDescription>{request.email}</CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Exam:</span> {request.examId === "general" ? "General Question" : request.examId}
          </div>
          <div>
            <span className="font-medium">Created:</span> {formatDate(request.createdAt)}
          </div>
          <div className="border-t pt-2 mt-2">
            <p className="whitespace-pre-wrap">{request.message}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 border-t pt-3">
        {request.status !== "in-progress" && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleUpdateStatus(request.id, "in-progress")}
          >
            Mark In Progress
          </Button>
        )}
        {request.status !== "resolved" && (
          <Button 
            size="sm" 
            variant="default" 
            onClick={() => handleUpdateStatus(request.id, "resolved")}
          >
            Mark Resolved
          </Button>
        )}
        {request.status === "resolved" && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleUpdateStatus(request.id, "pending")}
          >
            Reopen
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Support Requests</h2>
        <p className="text-muted-foreground">Manage student support requests</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressRequests.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({supportRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map(renderRequestCard)
          ) : (
            <p className="text-center py-8 text-muted-foreground">No pending requests</p>
          )}
        </TabsContent>
        
        <TabsContent value="in-progress" className="mt-4">
          {inProgressRequests.length > 0 ? (
            inProgressRequests.map(renderRequestCard)
          ) : (
            <p className="text-center py-8 text-muted-foreground">No in-progress requests</p>
          )}
        </TabsContent>
        
        <TabsContent value="resolved" className="mt-4">
          {resolvedRequests.length > 0 ? (
            resolvedRequests.map(renderRequestCard)
          ) : (
            <p className="text-center py-8 text-muted-foreground">No resolved requests</p>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="mt-4">
          {supportRequests.length > 0 ? (
            supportRequests.map(renderRequestCard)
          ) : (
            <p className="text-center py-8 text-muted-foreground">No support requests</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
