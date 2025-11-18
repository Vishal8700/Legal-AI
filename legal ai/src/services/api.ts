import axios from 'axios';

// Backend API base URL - update this based on your deployment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatRequest {
  question: string;
  use_documents: boolean;
}

export interface ChatResponse {
  answer: string;
  source: string;
}

export interface UploadResponse {
  message: string;
  total_chunks: number;
  files_processed: string[];
}

export interface HealthResponse {
  status: string;
  documents_loaded: boolean;
  using: string;
}

// Upload PDFs to backend
export const uploadPDFs = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post<UploadResponse>('/upload-pdfs/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Send chat message to backend
export const sendChatMessage = async (
  question: string,
  useDocuments: boolean = true,
  sessionId: string = 'default',
  documentTexts: string[] = []
): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat/', {
    question,
    use_documents: useDocuments,
    session_id: sessionId,
    document_texts: documentTexts,
  });

  return response.data;
};

// Check backend health
export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/health');
  return response.data;
};

export default api;
