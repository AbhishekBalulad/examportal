
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Camera, AlertOctagon } from "lucide-react";
import { getExamWarnings } from "@/services/ExamService";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExamWarningsProps {
  examId: string;
  studentId: string;
}

type Warning = {
  type: string;
  timestamp: string;
  imageUrl: string;
};

export function ExamWarnings({ examId, studentId }: ExamWarningsProps) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchWarnings = async () => {
      if (examId && studentId) {
        setLoading(true);
        try {
          const result = await getExamWarnings(examId, studentId);
          if (result.success) {
            setWarnings(result.warnings || []);
          }
        } catch (error) {
          console.error("Error fetching warnings:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchWarnings();
  }, [examId, studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-sm text-muted-foreground">Loading warnings...</span>
      </div>
    );
  }

  if (warnings.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-muted-foreground" />
            Exam Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No warnings detected during this exam</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <AlertOctagon className="mr-2 h-5 w-5 text-amber-500" />
          Exam Warnings
          <Badge variant="destructive" className="ml-2">{warnings.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {warnings.map((warning, index) => {
              const date = new Date(warning.timestamp);
              const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <div className="mb-2 sm:mb-0">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mb-2">
                        {warning.type}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {date.toLocaleDateString()} at {formattedTime}
                      </p>
                    </div>
                  </div>
                  {warning.imageUrl && (
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <img 
                        src={warning.imageUrl} 
                        alt={`Warning: ${warning.type}`}
                        className="w-full h-auto max-h-64 object-cover"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
