import React, { useCallback, useState } from 'react';
import { FileText, Archive } from 'lucide-react';
import JSZip from 'jszip';

interface UploaderProps {
  onFileUpload: (text: string) => void;
  isLoading: boolean;
}

export function Uploader({ onFileUpload, isLoading }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    
    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          onFileUpload(text);
        }
      };
      reader.onerror = () => {
        setError('Failed to read text file.');
      };
      reader.readAsText(file);
      return;
    }

    if (file.name.endsWith('.zip')) {
      try {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        
        // Find the first .txt file in the zip
        const txtFile = Object.values(loadedZip.files).find(f => f.name.endsWith('.txt') && !f.dir);
        
        if (!txtFile) {
          setError('No .txt chat file found inside the ZIP archive.');
          return;
        }

        const text = await txtFile.async('string');
        onFileUpload(text);
      } catch (err) {
        console.error(err);
        setError('Failed to extract the ZIP file. Please ensure it is a valid WhatsApp export.');
      }
      return;
    }

    setError('Please upload a valid .txt or .zip file exported from WhatsApp.');
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto mt-12 mb-8">
      <div 
        className={`w-full p-12 text-center rounded-3xl border-2 border-dashed transition-all duration-300 ease-out bg-white/50 backdrop-blur-md shadow-xl
          ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-300 hover:border-indigo-400 hover:bg-white'}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-100 rounded-full text-indigo-600 animate-bounce">
            {isLoading ? <FileText size={48} className="animate-pulse" /> : <Archive size={48} />}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isLoading ? 'Analyzing chat...' : 'Upload WhatsApp Chat'}
        </h2>
        
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Export your chat from WhatsApp (without media) and drag the <strong>.zip</strong> or <strong>.txt</strong> file here.
          <br /><br />
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Privacy First: All analysis happens securely in your browser.
          </span>
        </p>

        <label className="cursor-pointer inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200">
          <span>Browse File</span>
          <input 
            type="file" 
            className="hidden" 
            accept=".txt,.zip,application/zip,application/x-zip-compressed" 
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            disabled={isLoading}
          />
        </label>
        
        {error && (
          <div className="mt-4 text-red-500 text-sm font-medium bg-red-50 py-2 px-4 rounded-lg inline-block">
            {error}
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-slate-500 max-w-xl text-center">
        <strong>How to export:</strong> Open WhatsApp &gt; Go to Chat &gt; Tap Menu (or Contact Name) &gt; Export Chat &gt; Without Media &gt; Save the .zip or .txt file.
      </div>
    </div>
  );
}
