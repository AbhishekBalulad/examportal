
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Star, School, MapPin, Mail, Phone, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LoginForm } from "@/components/auth/LoginForm";
import { logoutUser, getCurrentUser } from "@/services/AuthService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const Index = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

 useEffect(() => {
    const autoLogout = async () => {
      await logoutUser();
    };

    autoLogout();
  }, []);

  const features = [
    {
      icon: <School className="h-10 w-10 text-exam-primary animate-bounce" />,
      title: "Smart Learning Environment",
      description: "Experience a modern online examination platform designed for seamless learning and assessment."
    },
    {
      icon: <BookOpen className="h-10 w-10 text-exam-primary animate-pulse" />,
      title: "Advanced Question Types",
      description: "Multiple choice, short answers, and more - tailored to meet diverse assessment needs."
    },
    {
      icon: <Star className="h-10 w-10 text-exam-primary animate-bounce" />,
      title: "Real-time Monitoring",
      description: "Advanced proctoring with AI-powered features to ensure exam integrity."
    }
  ];

  const testimonials = [
    {
      text: "This platform revolutionized how we conduct exams. The AI proctoring is fantastic!",
      author: "Tejas R",
      role: "Professor of Computer Science"
    },
    {
      text: "The interface is intuitive, and the real-time monitoring features are exceptional.",
      author: "Pawan Wadeyar",
      role: "Department Head"
    },
    {
      text: "As a student, I love how smooth and stress-free the exam experience is.",
      author: "Mahesh",
      role: "Student"
    }
  ];

  const benefits = [
    "AI-powered examination security",
    "Real-time performance analytics",
    "Automated grading system",
    "Scalable for institutions of any size",
    "Secure data handling and privacy",
    "24/7 technical support"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-primary animate-bounce" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SecureExam
              </span>
            </div>
            
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()}
                    onClick={() => scrollToSection("home")}
                  >
                    Home
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()}
                    onClick={() => scrollToSection("about")}
                  >
                    About Us
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()}
                    onClick={() => scrollToSection("features")}
                  >
                    Features
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()}
                    onClick={() => scrollToSection("testimonials")}
                  >
                    Testimonials
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()}
                    onClick={() => scrollToSection("contact")}
                  >
                    Contact Us
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                onClick={() => setShowLogin(true)}
                className="bg-primary/90 hover:bg-primary"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {showLogin ? (
          <div className="max-w-md mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => setShowLogin(false)}
              className="text-sm text-muted-foreground hover:text-primary mb-4 flex items-center"
            >
              ← Back to Home
            </button>
            <LoginForm />
          </div>
        ) : (
          <div className="py-12">
            {/* Hero Section */}
            <section id="home" className="py-12 mb-8 animate-fade-in">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-8">
                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                    <span className="block">Transform Your</span>
                    <span className="block text-primary">Examination Experience</span>
                  </h1>
                  <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Secure, intelligent, and user-friendly online examination platform powered by advanced AI technology.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button size="lg" onClick={() => setShowLogin(true)} className="animate-bounce">
                      Start Now
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => scrollToSection("about")}>
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="py-16 bg-gradient-to-r from-accent/10 to-secondary/10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold tracking-tight text-primary">About Us</h2>
                  <p className="mt-4 text-xl text-muted-foreground">Transforming education through technology</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-semibold">Our Mission</h3>
                    <p className="text-lg text-muted-foreground">
                      SecureExam is dedicated to revolutionizing the educational assessment process through cutting-edge technology. 
                      Founded by educators and technologists, we understand the challenges faced by institutions in conducting secure 
                      and fair examinations.
                    </p>
                    <h3 className="text-2xl font-semibold">Our Vision</h3>
                    <p className="text-lg text-muted-foreground">
                      We envision a future where educational assessment is seamless, secure, and accessible to all. 
                      Through continuous innovation, we aim to empower educational institutions worldwide with the tools 
                      they need to evaluate student performance effectively.
                    </p>
                  </div>
                  
                  <div className="bg-card p-8 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-6">Why Choose SecureExam?</h3>
                    <ul className="space-y-4">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-exam-success" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold tracking-tight text-primary">Our Features</h2>
                  <p className="mt-4 text-xl text-muted-foreground">Designed for modern education</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-in">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold tracking-tight text-primary">What Our Users Say</h2>
                  <p className="mt-4 text-xl text-muted-foreground">Trusted by educators and students worldwide</p>
                </div>
                
                <Carousel className="max-w-xl mx-auto">
                  <CarouselContent>
                    {testimonials.map((testimonial, index) => (
                      <CarouselItem key={index}>
                        <Card className="mx-4">
                          <CardHeader>
                            <CardDescription className="text-lg italic">
                              "{testimonial.text}"
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="font-semibold">{testimonial.author}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </section>

            {/* Contact Us Section */}
            <section id="contact" className="py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold tracking-tight text-primary">Contact Us</h2>
                  <p className="mt-4 text-xl text-muted-foreground">We'd love to hear from you</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-semibold">Get In Touch</h3>
                    <p className="text-lg text-muted-foreground">
                      Have questions or feedback? We're here to help. Contact our team for more information
                      about SecureExam and how it can benefit your institution.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <span>examportal@gmail.com</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <span>6360991933</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <address className="not-italic">
                          Bangalore
                        </address>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card p-8 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-6">Office Hours</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Monday - Friday</h4>
                        <p className="text-muted-foreground">9:00 AM - 6:00 PM</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Saturday</h4>
                        <p className="text-muted-foreground">10:00 AM - 4:00 PM</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Sunday</h4>
                        <p className="text-muted-foreground">Closed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="ml-2 font-semibold">SecureExam</span>
            </div>
            <div className="mt-4 md:mt-0 flex gap-6">
              <a href="#" onClick={() => scrollToSection("home")} className="text-sm text-muted-foreground hover:text-primary">Home</a>
              <a href="#" onClick={() => scrollToSection("about")} className="text-sm text-muted-foreground hover:text-primary">About</a>
              <a href="#" onClick={() => scrollToSection("features")} className="text-sm text-muted-foreground hover:text-primary">Features</a>
              <a href="#" onClick={() => scrollToSection("contact")} className="text-sm text-muted-foreground hover:text-primary">Contact</a>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
              © {new Date().getFullYear()} SecureExam Portal. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;