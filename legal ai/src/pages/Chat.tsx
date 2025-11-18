import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatStore } from "@/store/chatStore";
import DesktopLayout from "@/components/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Mic, MicOff, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { sendChatMessage } from "@/services/api";
import PDFToText from "react-pdftotext";

// New ChatMessage component with expand/collapse functionality
const ChatMessage = ({ msg }) => {
  const [expanded, setExpanded] = useState(false);

  // Determine if the message text is long enough to need truncation
  const isLongText = msg.text.split('\n').length > 5 || msg.text.length > 300;

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`flex gap-3 ${msg.isUser ? "flex-row" : "flex-row"}`}>
      {!msg.isUser && (
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
          <DotLottieReact
            src="https://lottie.host/e52b3dc2-923d-47a2-b135-70a24b9c7ac4/m7qdPrHCBZ.lottie"
            loop
            autoplay
            className="w-6 h-6"
          />
        </div>
      )}

      <div className={`max-w-[75%] rounded-2xl px-4 py-3 bg-card text-foreground shadow-sm border border-border ${msg.isUser ? "ml-auto" : ""}`}>
        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${!expanded && isLongText ? "line-clamp-5 overflow-hidden" : ""}`}
        >
          {msg.text}
        </p>

        {isLongText && (
          <button
            onClick={toggleExpand}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-2 transition-colors"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}

        <span className="text-xs mt-2 block text-muted-foreground">
          {msg.timestamp}
        </span>
      </div>

      {msg.isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-medium text-sm">U</span>
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCurrentChat, addMessage, addChat, setCurrentChat } = useChatStore();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sessionDocuments, setSessionDocuments] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionId = useRef(Date.now().toString());

  const currentChat = getCurrentChat();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition() as SpeechRecognition;
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setMessage(prev => prev + finalTranscript + ' ');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [toast]);

  useEffect(() => {
    if (id) {
      setCurrentChat(id);
    } else {
      const newChat = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addChat(newChat);
      navigate(`/chat/${newChat.id}`, { replace: true });
    }
  }, [id, setCurrentChat, addChat, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  // Extract text from PDFs
  const extractPDFText = async (file: File): Promise<string> => {
    try {
      const text = await PDFToText(file);
      if (!text || text.trim().length < 10) {
        throw new Error("No readable text found in PDF.");
      }
      return text.trim();
    } catch (error: any) {
      throw new Error(`Failed to extract text from ${file.name}: ${error.message}`);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || !currentChat) return;

    setIsLoading(true);

    // Extract PDF texts if files are selected (new documents)
    let newDocumentTexts: string[] = [];
    if (selectedFiles.length > 0) {
      try {
        newDocumentTexts = await Promise.all(selectedFiles.map(file => extractPDFText(file)));
        // Add to session documents
        setSessionDocuments(prev => [...prev, ...newDocumentTexts]);
      } catch (error: any) {
        toast({
          title: "PDF Extraction Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      text: selectedFiles.length > 0 
        ? `${message.trim() || "Analyze these documents"}\n\n📎 ${selectedFiles.map(f => f.name).join(', ')}`
        : message.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    addMessage(currentChat.id, userMessage);
    const currentMessage = message.trim();
    setMessage("");
    setSelectedFiles([]);

    let botResponse;
    try {
      // Send message to backend
      // Only send document texts if new documents were added
      const hasDocuments = sessionDocuments.length > 0 || newDocumentTexts.length > 0;
      const response = await sendChatMessage(
        currentMessage || "Analyze these documents",
        hasDocuments,
        sessionId.current,
        newDocumentTexts // Only send new documents, backend maintains session
      );
      
      botResponse = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to get response from server.";
      botResponse = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${errorMessage}\n\nPlease ensure the backend server is running and try again.`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }

    addMessage(currentChat.id, botResponse);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length > 3) {
      toast({
        title: "Too Many Files",
        description: "Please select up to 3 PDF files.",
        variant: "destructive",
      });
      return;
    }
    
    if (pdfFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...pdfFiles].slice(0, 3));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (!currentChat) {
    return (
      <DesktopLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-medium text-foreground mb-2">Loading chat...</h2>
            <p className="text-muted-foreground">
              Please wait while we set up your conversation.
            </p>
          </div>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout>
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-none">
          <h2 className="font-medium text-foreground">{currentChat.title}</h2>
        </div>

        {/* Messages container with reduced padding */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="max-w-5xl mx-auto px-2 space-y-4">
            {currentChat.messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center mx-auto mb-4">
                  <DotLottieReact
                    src="https://lottie.host/e52b3dc2-923d-47a2-b135-70a24b9c7ac4/m7qdPrHCBZ.lottie"
                    loop
                    autoplay
                    className="w-10 h-10"
                  />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Start a conversation</h3>
                <p className="text-muted-foreground">
                  {sessionDocuments.length > 0 
                    ? `${sessionDocuments.length} document(s) loaded. Ask questions about them or add more PDFs.`
                    : "Type a message, attach PDFs (up to 3), and send to get AI-powered legal assistance."}
                </p>
              </div>
            ) : (
              <>
                {/* Updated message mapping to use ChatMessage component */}
                {currentChat.messages.map((msg) => (
                  <ChatMessage key={msg.id} msg={msg} />
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                      <DotLottieReact
                        src="https://lottie.host/e52b3dc2-923d-47a2-b135-70a24b9c7ac4/m7qdPrHCBZ.lottie"
                        loop
                        autoplay
                        className="w-6 h-6"
                      />
                    </div>

                    <div className="bg-card border border-border rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Floating input bar with reduced padding */}
        <div className="pointer-events-none fixed bottom-0 left-20 w-full z-10 pb-4 pl-16">
          <div className="pointer-events-auto max-w-5xl mx-auto px-2">
            <div className="relative bg-card border border-border rounded-2xl shadow-xl p-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground shrink-0"
                onClick={handleFileButtonClick}
                disabled={isLoading || selectedFiles.length >= 3}
                title="Attach PDF files (up to 3)"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              
              <Button
                variant="ghost"
                size="sm"
                className={`shrink-0 ${
                  isListening 
                    ? "text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={toggleVoiceRecognition}
                disabled={isLoading}
                title={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <div className="flex items-center relative w-full rounded-full border-none ">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isListening
                      ? "Listening..."
                      : selectedFiles.length > 0
                      ? "Add a message or send documents..."
                      : "Type your message or attach PDFs..."
                  }
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 bg-transparent border-none focus:outline-none rounded-full ${
                    isListening ? "ring-2 ring-red-300 dark:ring-red-700" : ""
                  }`}
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  disabled={(!message.trim() && selectedFiles.length === 0) || isLoading}
                  className="m-1 w-10 h-10 ml-4 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-2 ml-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-md inline-flex items-center gap-1">
                    📎 {file.name}
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-1 hover:text-red-500"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {isListening && (
              <div className="mt-2 ml-2">
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md inline-block animate-pulse">
                  🎤 Listening for voice input...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add bottom padding to prevent content being hidden behind floating input */}
        <div className="h-20"></div>
      </div>
    </DesktopLayout>
  );
};

export default Chat;
