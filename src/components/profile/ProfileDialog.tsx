
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, KeyRound } from "lucide-react";
import { uploadToCloudinary } from "@/utils/CloudinaryUpload";
import { updateUserProfile, getCurrentUser, resetPassword } from "@/services/AuthService";
import {  getFullCurrentUser } from "@/services/Fulldata";

interface ProfileData {
  name: string;
  email: string;
  profileImage: string;
  registerNumber?: string;
  department?: string;
  adharNumber?: string;
  address?: string;
}

export function ProfileDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    email: "",
    profileImage: "",
    registerNumber: "",
    department: "",
    adharNumber: "",
    address: "",
  });
  const { toast } = useToast();

  const loadUser = async () => {
    try {
      const currentUser = await getFullCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          name: currentUser.name || "",
          email: currentUser.email || "",
          profileImage: currentUser.profileImage || "",
          registerNumber: currentUser.registerNumber || "",
          department: currentUser.department || "",
          adharNumber: currentUser.adharNumber || "",
          address: currentUser.address || "",
        });
      }
    } catch (error) {
      console.error("Error loading user:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      loadUser();
    }
  }, [open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const imageUrl = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, profileImage: imageUrl }));
      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { success, error } = await updateUserProfile({
        ...formData,
        id: user.id,
      });

      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
        setOpen(false);
      } else {
        throw new Error(error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setLoading(true);
      const { success, error } = await resetPassword(user.email);
      
      if (success) {
        toast({
          title: "Password reset email sent",
          description: "Please check your email for the password reset link.",
        });
      } else {
        throw new Error(error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4 pb-6 border-b">
            <Avatar className="h-24 w-24">
              {formData.profileImage ? (
                <AvatarImage src={formData.profileImage} alt={formData.name} />
              ) : (
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <Label
                htmlFor="image"
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 py-2 px-4"
              >
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </Label>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registerNumber">Register Number</Label>
                <Input
                  id="registerNumber"
                  placeholder="Enter register number"
                  value={formData.registerNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, registerNumber: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Enter department"
                  value={formData.department}
                  readOnly
                  disabled                  
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adharNumber">Aadhar Number</Label>
                <Input
                  id="adharNumber"
                  placeholder="Enter Aadhar number"
                  value={formData.adharNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, adharNumber: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled={true}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full" type="button">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Change Password</AlertDialogTitle>
                    <AlertDialogDescription>
                      We'll send you an email with instructions to reset your password.
                      Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePasswordReset}>
                      Send Reset Link
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
