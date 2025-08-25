# AI Document Summarizer

A powerful, AI-driven document summarization platform built with Next.js and Firebase, featuring Google's Gemini 1.5 Flash API for intelligent text processing.

## 🚀 Features

### Core Functionality
- **Document Upload**: Support for DOCX and TXT files (up to 10MB)
- **AI-Powered Summarization**: Multiple summary types with customizable length and tone
- **Smart Text Extraction**: Client-side processing for TXT files, server-side for DOCX
- **Export Options**: Copy to clipboard or download as TXT files

### Summarization Options
- **Summary Types**: Short summaries, bullet points, or custom length
- **Tone Selection**: Neutral, professional, casual, or academic
- **Highlight Extraction**: Automatic extraction of keywords, names, and dates
- **Compression Analytics**: Real-time word count and compression ratio tracking

### User Experience
- **Authentication**: Google OAuth and email/password login
- **Document History**: Search and manage all previous summaries
- **Real-time Stats**: Track documents processed and time saved
- **Responsive Design**: Optimized for desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.0 with React 19.1.0
- **Styling**: TailwindCSS with Lucide React icons
- **Backend**: Next.js API routes (serverless)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: Google Gemini 1.5 Flash API
- **File Processing**: Mammoth.js for DOCX, native File API for TXT
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled
- Google AI API key (Gemini)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-document-summarizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Google AI (Gemini) API Key
   GOOGLE_AI_API_KEY=your_gemini_api_key

   # Next.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Firebase Setup**
   
   Deploy Firestore security rules and indexes:
   ```bash
   firebase login
   firebase init firestore
   firebase deploy --only firestore
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔐 Firebase Configuration

### Firestore Security Rules
The application uses user-based security rules ensuring users can only access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /summaries/{summaryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Required Indexes
- Collection: `summaries`
- Fields: `userId` (Ascending) + `createdAt` (Descending)

## 📊 Data Structure

### Summary Document Schema
```typescript
{
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  originalText: string; // First 1000 characters
  summary: string;
  summaryType: 'short' | 'bullet' | 'custom';
  tone: 'neutral' | 'professional' | 'casual' | 'academic';
  customLength?: number;
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;
  highlights: {
    keywords: string[];
    names: string[];
    dates: string[];
  };
  createdAt: Timestamp;
}
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
Ensure all environment variables from `.env.local` are added to your deployment platform.

## 📱 API Endpoints

- `POST /api/upload` - File upload and text extraction
- `POST /api/summarize` - AI summarization with Gemini API

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Google Gemini AI for powerful text summarization
- Firebase for seamless backend services
- Next.js team for the excellent React framework
- Vercel for deployment platform

