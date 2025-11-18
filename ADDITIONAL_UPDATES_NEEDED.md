# Additional Updates Needed

## Components Still Using Direct AI Calls

The following components still make direct calls to OpenRouter API and should be updated to use the backend:

### 1. MainContent.tsx
**Location:** `JustitiaAI-main/src/components/MainContent.tsx`
**Used in:** Index page (home page)
**Current behavior:** 
- Extracts text from PDFs and images
- Sends directly to OpenRouter API for analysis
- Displays results in the component

**Recommended action:**
- Update to use backend API (`/upload-pdfs/` and `/chat/`)
- Remove direct OpenRouter calls
- Use the same pattern as Chat.tsx

### 2. ChatWindow.tsx
**Location:** `JustitiaAI-main/src/components/ChatWindow.tsx`
**Used in:** Not currently imported anywhere (appears to be unused)
**Current behavior:** 
- Similar to Chat.tsx but older version
- Makes direct OpenRouter API calls

**Recommended action:**
- This component appears unused (no imports found)
- Can be safely deleted OR
- Updated to use backend API if needed in future

## Priority

### High Priority ✅ COMPLETED
- [x] Chat.tsx - Main chat interface (UPDATED)
- [x] Backend CORS support (ADDED)
- [x] API service layer (CREATED)

### Medium Priority ⚠️ TODO
- [ ] MainContent.tsx - Home page document analysis
  - Update PDF upload to use backend
  - Update analysis to use backend chat endpoint
  - Remove direct OpenRouter calls

### Low Priority 📝 OPTIONAL
- [ ] ChatWindow.tsx - Unused component
  - Delete if confirmed unused
  - Or update if planning to use

## How to Update MainContent.tsx

Follow the same pattern used in Chat.tsx:

1. Import the API service:
```typescript
import { sendChatMessage, uploadPDFs } from "@/services/api";
```

2. Remove direct OpenRouter API calls

3. Replace with backend API calls:
```typescript
// Instead of direct OpenRouter call:
const response = await sendChatMessage(question, true);
```

4. Update file upload logic to support 2-3 PDFs:
```typescript
const result = await uploadPDFs(selectedFiles);
```

5. Update UI to show upload status

## Current Status

✅ **Working:** Chat page (`/chat`) - fully migrated to backend
⚠️ **Needs Update:** Home page (`/`) - still uses direct API calls
📝 **Optional:** ChatWindow component - appears unused

## Testing After Updates

Once MainContent.tsx is updated:

1. Test home page document upload
2. Test document analysis on home page
3. Verify no direct OpenRouter calls in browser network tab
4. Ensure all features work through backend

## Notes

- The Chat page is fully functional with backend
- Users can use `/chat` route for all chatbot features
- Home page can be updated later if needed
- Consider removing unused components to reduce maintenance
