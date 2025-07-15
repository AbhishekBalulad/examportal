
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { ref, push, serverTimestamp, onValue } from "firebase/database";
import { db } from "@/config/firebase";
import { getExamsForStudent } from "@/services/ExamService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

interface HelpFormValues {
  name: string;
  email: string;
  examId: string;
  message: string;
}

interface SupportRequest {
  id: string;
  name: string;
  email: string;
  examId: string;
  message: string;
  status: "pending" | "in-progress" | "resolved";
  createdAt: number;
  studentId: string;
}

export function HelpDialog({ open, onOpenChange, studentId, studentName, studentEmail }: HelpDialogProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<HelpFormValues>({
    defaultValues: {
      name: studentName,
      email: studentEmail,
      examId: "",
      message: "",
    },
  });

  // Fetch student's exams for the dropdown
  useEffect(() => {
    const fetchExams = async () => {
      if (!open || !studentId) return;
      
      setIsLoadingExams(true);
      try {
        const studentExams = await getExamsForStudent(studentId);
        if (studentExams && studentExams.length > 0) {
          setExams(studentExams);
        } else {
          setExams([]);
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
        toast({
          title: "Failed to load exams",
          description: "Could not retrieve your exams. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingExams(false);
      }
    };

    if (open) {
      fetchExams();
    }
  }, [open, studentId, toast]);

  // Fetch student's support requests
  useEffect(() => {
    if (!open || !studentId) return;

    setIsLoadingRequests(true);
    const supportRef = ref(db, "support");
    
    const unsubscribe = onValue(supportRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const requestsArray = Object.keys(data)
          .filter(key => data[key].studentId === studentId)
          .map(key => ({
            id: key,
            ...data[key],
          }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        setSupportRequests(requestsArray);
      } else {
        setSupportRequests([]);
      }
      setIsLoadingRequests(false);
    });
    
    return () => unsubscribe();
  }, [open, studentId]);

  const onSubmit = async (values: HelpFormValues) => {
    setLoading(true);
    try {
      const supportRef = ref(db, "support");
      await push(supportRef, {
        ...values,
        studentId,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Support request sent",
        description: "Your message has been sent to the teacher. We'll get back to you soon.",
      });
      
      onOpenChange(false);
      form.reset({
        name: studentName,
        email: studentEmail,
        examId: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Failed to send request",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Support Center</DialogTitle>
          <DialogDescription>
            Get help from your teacher or check the status of your previous requests.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="new-request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-request">New Request</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests ({supportRequests.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new-request">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="examId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Exam</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={isLoadingExams ? "Loading exams..." : "Select an exam"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exams.length > 0 ? (
                            exams.map(exam => (
                              <SelectItem key={exam.id} value={exam.id}>
                                {exam.title}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="general" disabled={isLoadingExams}>
                              {isLoadingExams ? "Loading exams..." : "No exams found"}
                            </SelectItem>
                          )}
                          <SelectItem value="general">General Question (No Specific Exam)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your issue or question here..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="my-requests">
            {isLoadingRequests ? (
              <div className="py-10 text-center">
                <div className="h-6 w-6 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading your support requests...</p>
              </div>
            ) : supportRequests.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {supportRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-3 text-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{request.examId === "general" ? "General Question" : 
                          exams.find(e => e.id === request.examId)?.title || request.examId}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-muted-foreground break-words whitespace-pre-wrap">{request.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">You haven't submitted any support requests yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
