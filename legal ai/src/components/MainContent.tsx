

import { Button } from "@/components/ui/button";
import { Search, Brain, Image as ImageIcon, Zap, Plus, Upload, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import PDFToText from "react-pdftotext";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { sendChatMessage } from "@/services/api";

const MainContent = () => {
  const { addChat, setCurrentChat, user } = useChatStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNewChat = () => {
    try {
      const newChat = {
        id: Date.now().toString(),
        title: "New Legal Consultation",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addChat(newChat);
      setCurrentChat(newChat.id);
      navigate(`/chat/${newChat.id}`);
      console.log("New chat created:", newChat);
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast({
        title: "Error",
        description: "Failed to create a new chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleActionClick = (action: string) => {
    toast({
      title: `${action} Feature`,
      description: `${action} functionality would be implemented here.`,
    });
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const text = await PDFToText(file);
      console.log(`Extracted text from ${file.name}:`, text);
      if (!text || text.trim().length < 10) {
        throw new Error("No readable text found in PDF.");
      }
      return text.trim();
    } catch (error) {
      console.error("PDF extraction error:", error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  };

  const analyzeLegalDocument = async (extractedText: string, fileName: string): Promise<string> => {
    try {
      // Send analysis request with document text
      const analysisPrompt = `Provide a comprehensive legal analysis of the uploaded document under Indian judiciary laws:

**ANALYSIS REQUIREMENTS:**
1. Document Classification: Identify the type of legal document.
2. Legal Validity Assessment: Check compliance with Indian laws.
3. Clause Analysis: Review each major clause for legal soundness, enforceability, and potential risks.
4. Compliance Check: Verify adherence to applicable Indian statutes.
5. Risk Assessment: Identify legal vulnerabilities.
6. Recommendations: Suggest improvements and safeguards.
7. Relevant Legal Sections: Cite specific Indian law sections.
8. Red Flags: Highlight problematic clauses or missing elements.

Provide a detailed, professional legal consultation report.`;

      const response = await sendChatMessage(
        analysisPrompt,
        true,
        `analysis-${Date.now()}`,
        [extractedText] // Send document text separately
      );

      return response.answer;
    } catch (error: any) {
      console.error("Legal Analysis Error:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Unknown error";
      throw new Error(`Failed to analyze document: ${errorMsg}`);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";

    if (file.type === "application/pdf") {
      setSelectedFile(file);
      setIsProcessing(true);
      
      toast({
        title: "Processing Document",
        description: `Extracting text from "${file.name}"...`,
      });

      let extractedText = "";

      try {
        if (file.type === "application/pdf") {
          extractedText = await extractTextFromPDF(file);
        } else {
          throw new Error("Only PDF files are supported for analysis.");
        }

        if (!extractedText.trim()) {
          throw new Error("No text extracted from the file.");
        }

        toast({
          title: "Text Extracted",
          description: `Successfully extracted text from "${file.name}". Analyzing...`,
        });

        const aiResponse = await analyzeLegalDocument(extractedText, file.name);

        const newChat = {
          id: Date.now().toString(),
          title: `Legal Analysis: ${file.name}`,
          messages: [
            {
              id: crypto.randomUUID(),
              text: `📄 **Document Uploaded:** ${file.name}\n\n**Extracted Content:**\n${extractedText.substring(0, 500)}${extractedText.length > 500 ? "..." : ""}`,
              isUser: true,
              timestamp: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              text: aiResponse,
              isUser: false,
              timestamp: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        addChat(newChat);
        setCurrentChat(newChat.id);
        navigate(`/chat/${newChat.id}`);
        
        toast({
          title: "Analysis Complete",
          description: `Legal analysis for "${file.name}" is ready.`,
        });
      } catch (error: any) {
        console.error("Error processing file:", error);
        const errorMessage = error.message || "Unknown error occurred";
        toast({
          title: "Processing Error",
          description: `Failed to process "${file.name}". ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        setSelectedFile(null);
      }
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  };

  const actionButtons = [
    { icon: Search, label: "Legal Search" },
    { icon: Brain, label: "Legal Advice" },
    { icon: ImageIcon, label: "Document Analysis" },
    { icon: Zap, label: "Clause Verification" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center">
            <DotLottieReact
              src="https://lottie.host/3538fa0a-6263-48e7-b941-61f96fffef2f/x6mgrhK4OG.lottie"
              loop
              autoplay
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Please Log In
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Log in via the sidebar to access Justitia.ai Consultancy.
          </p>
          <p className="text-sm text-muted-foreground">
            ✨ Use the Google login option in the sidebar to get started...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 border-border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Justitia.ai Consultancy Services</span>
          </div>
          <Button
            onClick={handleNewChat}
            className="bg-primary hover:bg-primary-dark text-primary-foreground font-medium px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Consultation
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-40 h-30 rounded-full mx-auto mb-6 flex items-center justify-center">
            <DotLottieReact
              src="https://lottie.host/3538fa0a-6263-48e7-b941-61f96fffef2f/x6mgrhK4OG.lottie"
              loop
              autoplay
              className="w-40 h-30"
            />
          </div>

          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
            {getGreeting()}, {user.name}
          </h1>

          <h2 className="text-xl mb-8 font-semibold text-white">
            How Can I{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent font-bold">
              Assist You with Legal Matters Today?
            </span>
          </h2>

          <div className="flex justify-center gap-4 mb-8">
            {actionButtons.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  onClick={() => handleActionClick(action.label)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-border hover:bg-muted"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="mb-8">
            <div className="relative inline-block">
              <input
                id="file-upload"
                type="file"
                accept="application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-border hover:bg-muted disabled:opacity-50 pointer-events-none"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {isProcessing ? "Processing..." : "Upload Document (PDF)"}
                </span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Upload legal documents to verify flaws, correctness, clauses, and sections under Indian judiciary laws.
            </p>
            {selectedFile && (
              <p className="text-xs text-primary mt-1">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            ✨ Ask a legal query, upload a document, or request consultation on Indian laws...
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainContent;