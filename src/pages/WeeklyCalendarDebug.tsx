import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Error Boundary Component
class WeeklyCalendarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('WeeklyCalendar Error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WeeklyCalendar componentDidCatch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col min-h-screen bg-gray-50 p-4">
          <h1 className="text-xl font-bold text-red-600 mb-4">WeeklyCalendar Error</h1>
          <pre className="bg-red-50 p-4 rounded text-sm overflow-auto">
            {this.state.error?.stack || this.state.error?.message || 'Unknown error'}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Minimal WeeklyCalendar with progressive loading
function WeeklyCalendarDebug() {
  console.log('🔍 WeeklyCalendar: Starting render');
  
  const navigate = useNavigate();
  const [debugStep, setDebugStep] = useState(1);
  
  useEffect(() => {
    console.log('🔍 WeeklyCalendar: useEffect running, step:', debugStep);
  }, [debugStep]);

  console.log('🔍 WeeklyCalendar: About to return JSX');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4">
        <h1 className="text-xl font-bold">WeeklyCalendar Debug - Step {debugStep}</h1>
        <button 
          onClick={() => setDebugStep(step => step + 1)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Next Step ({debugStep})
        </button>
        
        <div className="mt-4 space-y-2">
          <div>✅ Base component renders</div>
          <div>✅ React hooks work</div>
          <div>✅ State management works</div>
          
          {debugStep >= 2 && (
            <div>
              <div>🔍 Testing navigate function...</div>
              <div>Navigate function: {typeof navigate}</div>
            </div>
          )}
          
          {debugStep >= 3 && (
            <div>
              <div>🔍 Testing imports...</div>
              <TestImports />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestImports() {
  try {
    console.log('🔍 Testing imports...');
    
    // Test each import one by one
    const imports = {
      'StackedChildBadges': async () => {
        const { StackedChildBadges } = await import('../components/common');
        return StackedChildBadges;
      },
      'GlobalHeader': async () => {
        const { GlobalHeader } = await import('../components/navigation');
        return GlobalHeader;
      },
      'GlobalFooter': async () => {
        const { GlobalFooter } = await import('../components/navigation');
        return GlobalFooter;
      },
      'GlobalSubheader': async () => {
        const { GlobalSubheader } = await import('../components/navigation');
        return GlobalSubheader;
      },
      'GlobalChatDrawer': async () => {
        const { GlobalChatDrawer } = await import('../components/chat');
        return GlobalChatDrawer;
      },
      'ChatMessageList': async () => {
        const { ChatMessageList } = await import('../components/chat');
        return ChatMessageList;
      },
      'useKicacoStore': async () => {
        const { useKicacoStore } = await import('../store/kicacoStore');
        return useKicacoStore;
      },
      'sendMessageToAssistant': async () => {
        const { sendMessageToAssistant } = await import('../utils/talkToKicaco');
        return sendMessageToAssistant;
      },
      'lucide-react': async () => {
        const icons = await import('lucide-react');
        return icons.Calendar;
      },
      'date-fns': async () => {
        const dateFns = await import('date-fns');
        return dateFns.format;
      },
      'getKicacoEventPhoto': async () => {
        const { getKicacoEventPhoto } = await import('../utils/getKicacoEventPhoto');
        return getKicacoEventPhoto;
      },
      'generateUUID': async () => {
        const { generateUUID } = await import('../utils/uuid');
        return generateUUID;
      }
    };

    const [importResults, setImportResults] = useState<Record<string, string>>({});

    useEffect(() => {
      const testImports = async () => {
        const results: Record<string, string> = {};
        
        for (const [name, importFn] of Object.entries(imports)) {
          try {
            console.log(`🔍 Testing import: ${name}`);
            const result = await importFn();
            results[name] = typeof result === 'function' ? '✅ Function' : `✅ ${typeof result}`;
            console.log(`✅ ${name}: ${typeof result}`);
          } catch (error) {
            console.error(`❌ ${name}:`, error);
            results[name] = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        }
        
        setImportResults(results);
      };

      testImports();
    }, []);

    return (
      <div className="mt-4">
        <h3 className="font-semibold">Import Test Results:</h3>
        <div className="mt-2 space-y-1 text-sm">
          {Object.entries(importResults).map(([name, result]) => (
            <div key={name} className={result.startsWith('✅') ? 'text-green-600' : 'text-red-600'}>
              <strong>{name}:</strong> {result}
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('🔍 TestImports error:', error);
    return (
      <div className="text-red-600">
        Error in TestImports: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
}

export default function WeeklyCalendarWithErrorBoundary() {
  return (
    <WeeklyCalendarErrorBoundary>
      <WeeklyCalendarDebug />
    </WeeklyCalendarErrorBoundary>
  );
} 