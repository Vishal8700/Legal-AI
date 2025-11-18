

import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Mic, MicOff, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PDFToText from "react-pdftotext";
import { sendChatMessage } from "@/services/api";

// Type declarations for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const ChatWindow = () => {
  const { user, getCurrentChat, addMessage, addChat, setCurrentChat } = useChatStore();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const currentChat = getCurrentChat();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sessionDocuments, setSessionDocuments] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const sessionId = useRef(Date.now().toString());

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setMessage(prev => prev + finalTranscript + ' ');
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
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
  }, []);

  useEffect(() => {
    if (chatId) {
      setCurrentChat(chatId);
    } else if (!currentChat) {
      const newChat = {
        id: Date.now().toString(),
        title: "New Legal Consultation",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addChat(newChat);
      navigate(`/chat/${newChat.id}`, { replace: true });
    }
  }, [chatId, setCurrentChat, addChat, navigate, currentChat]);

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

    // Extract PDF texts if files are selected
    let newDocumentTexts: string[] = [];
    if (selectedFiles.length > 0) {
      try {
        newDocumentTexts = await Promise.all(selectedFiles.map(file => extractPDFText(file)));
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addMessage(currentChat.id, userMessage);
    const currentMessage = message.trim();
    setMessage("");
    setSelectedFiles([]);

    let botResponse;
    try {
      const hasDocuments = sessionDocuments.length > 0 || newDocumentTexts.length > 0;
      const response = await sendChatMessage(
        currentMessage || "Analyze these documents",
        hasDocuments,
        sessionId.current,
        newDocumentTexts
      );
      
      botResponse = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to get response from server.";
      botResponse = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${errorMessage}\n\nPlease ensure the backend server is running and try again.`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    addMessage(currentChat.id, botResponse);
    setIsLoading(false);
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

  if (!user || !currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-foreground mb-2">Loading chat...</h2>
          <p className="text-muted-foreground">Please wait while we set up your conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-chat-bg">
      <div className="p-3 border-b border-border">
        <h2 className="font-medium text-foreground">{currentChat.title}</h2>
      </div>

      {/* Messages container with reduced padding */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="px-1 space-y-4">
          {currentChat.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-light to-primary rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Start a conversation</h3>
              <p className="text-muted-foreground">
                {sessionDocuments.length > 0 
                  ? `${sessionDocuments.length} document(s) loaded. Ask questions about them or add more PDFs.`
                  : "Type a message, attach PDFs (up to 3), and send to get AI-powered legal assistance."}
              </p>
            </div>
          ) : (
            currentChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {!msg.isUser && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    🤖
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.isUser 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card text-foreground shadow-sm border border-border"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  <span className={`text-xs mt-2 block ${
                    msg.isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
                
                {msg.isUser && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-medium text-sm">U</span>
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                🤖
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating input bar */}
      <div className="pointer-events-none fixed bottom-0 left-10 w-full z-10 pb-4 pl-16">
  <div className="pointer-events-auto max-w-4xl mx-auto px-2">
    <div className="relative bg-card rounded-3xl p-3 flex items-center gap-2">
      
      {/* File Upload */}
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 text-muted-foreground"
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

      {/* Mic Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`shrink-0 ${
          isListening ? "text-red-500 bg-transparent" : "text-muted-foreground"
        }`}
        onClick={toggleVoiceRecognition}
        disabled={isLoading}
        title={isListening ? "Stop voice input" : "Start voice input"}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>

      {/* Input + Send */}
      <div className="flex items-center relative w-full bg-[#262626] p-1 rounded-full">
        <Input
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }}
  placeholder={
    isListening
      ? "Listening..."
      : selectedFiles.length > 0
      ? "Add a message or send documents..."
      : "Type your message or attach PDFs..."
  }
  disabled={isLoading}
  className="flex-1 px-4 py-3 bg-transparent border-none rounded-full focus:outline-none focus:ring-0"
/>

        <Button
          onClick={handleSend}
          size="icon"
          disabled={(!message.trim() && selectedFiles.length === 0) || isLoading}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          title="Send message"
        >
          <Send className="w-5 h-5 text-white" />
        </Button>
      </div>
    </div>

    {/* File Preview */}
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

    {/* Listening Indicator */}
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
  );
};

export default ChatWindow;
