import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DebugInfo {
  apiKeyPresent: boolean;
  assistantIdPresent: boolean;
  projectIdPresent: boolean;
  userAgent: string;
  screenSize: string;
  errors: string[];
}

export const MobileDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    apiKeyPresent: false,
    assistantIdPresent: false,
    projectIdPresent: false,
    userAgent: '',
    screenSize: '',
    errors: []
  });

  useEffect(() => {
    // Collect debug information
    setDebugInfo({
      apiKeyPresent: !!import.meta.env.VITE_OPENAI_API_KEY,
      assistantIdPresent: !!import.meta.env.VITE_ASSISTANT_ID,
      projectIdPresent: !!import.meta.env.VITE_OPENAI_PROJECT_ID,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      errors: []
    });

    // Listen for console errors
    const originalError = console.error;
    console.error = (...args) => {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, args.join(' ')].slice(-5) // Keep last 5 errors
      }));
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg z-50 text-xs"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Debug Info</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Environment</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>API Key:</span>
                <span className={debugInfo.apiKeyPresent ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.apiKeyPresent ? '✓ Present' : '✗ Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Assistant ID:</span>
                <span className={debugInfo.assistantIdPresent ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.assistantIdPresent ? '✓ Present' : '✗ Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Project ID:</span>
                <span className={debugInfo.projectIdPresent ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.projectIdPresent ? '✓ Present' : '✗ Missing'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Device Info</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Screen:</span> {debugInfo.screenSize}
              </div>
              <div>
                <span className="font-medium">User Agent:</span>
                <div className="text-xs text-gray-600 mt-1">{debugInfo.userAgent}</div>
              </div>
            </div>
          </div>

          {debugInfo.errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Recent Errors</h3>
              <div className="space-y-2">
                {debugInfo.errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-600 p-2 bg-red-50 rounded">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 pt-4 border-t">
            <p className="font-semibold mb-1">Troubleshooting Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure all environment variables are set</li>
              <li>Check browser console for detailed errors</li>
              <li>Try clearing browser cache and cookies</li>
              <li>Verify internet connection is stable</li>
              <li>Consider using desktop browser if mobile fails</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 