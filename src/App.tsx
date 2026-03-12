import { useState } from 'react';
import { Uploader } from './components/Uploader';
import { Dashboard } from './components/Dashboard';
import { parseWhatsAppChat } from './utils/parser';
import { analyzeChat } from './utils/analyzer';
import type { AnalysisResult } from './types';
import { HeartPulse } from 'lucide-react';

function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Small timeout to allow UI update for loading state since parsing can block main thread
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const messages = parseWhatsAppChat(text);
      if (messages.length === 0) {
        throw new Error("Could not parse any messages. Ensure this is a valid WhatsApp text export.");
      }
      
      const result = analyzeChat(messages);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while analyzing the chat.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background decorations */}
      <div className="fixed top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-100/50 to-transparent pointer-events-none" />
      <div className="fixed -top-32 -left-32 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl pointer-events-none" />
      <div className="fixed top-32 -right-32 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4 text-indigo-600">
            <HeartPulse size={40} className="mr-3" />
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Bond
            </h1>
          </div>
          <p className="mt-4 max-w-2xl text-lg text-slate-500 mx-auto">
            Discover the unspoken patterns of your relationship. Upload your WhatsApp chat and let the analysis reveal your communication style.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!analysisResult ? (
          <Uploader onFileUpload={handleFileUpload} isLoading={isLoading} />
        ) : (
          <Dashboard data={analysisResult} onReset={handleReset} />
        )}
      </main>
      
      {/* Footer */}
      <footer className="fixed bottom-0 w-full py-4 bg-white/80 backdrop-blur-sm border-t border-slate-200">
        <p className="text-center text-xs text-slate-400 font-medium">
          Privately Analyzed Locally. No data leaves your browser.
        </p>
      </footer>
    </div>
  );
}

export default App;
