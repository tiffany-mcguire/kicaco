import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckSquare, MessageSquare } from 'lucide-react';
import { format, parse, isToday, isTomorrow, isYesterday } from 'date-fns';

type SearchResult = {
  type: 'event' | 'keeper' | 'message';
  id: string;
  title: string;
  date?: string;
  childName?: string;
  content?: string;
  matchContext?: string;
  source: any;
};

interface SearchResultsProps {
  results: SearchResult[];
  isVisible: boolean;
  onResultClick: (result: SearchResult) => void;
  onClose: () => void;
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  
  try {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    
    return format(date, 'MMM d');
  } catch (error) {
    return dateStr;
  }
};

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isVisible,
  onResultClick,
  onClose
}) => {
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="absolute top-16 left-0 right-0 bg-white z-10 shadow-lg max-h-[70vh] overflow-y-auto"
        >
          <div className="p-2">
            {results.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No results found
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-md"
                    onClick={() => {
                      onResultClick(result);
                      onClose();
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {result.type === 'event' ? (
                          <Calendar size={18} className="text-[#217e8f]" />
                        ) : result.type === 'keeper' ? (
                          <CheckSquare size={18} className="text-[#217e8f]" />
                        ) : (
                          <MessageSquare size={18} className="text-[#217e8f]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900 truncate">
                            {result.title}
                          </h4>
                          {result.date && (
                            <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                              {formatDate(result.date)}
                            </span>
                          )}
                        </div>
                        
                        {result.childName && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            {result.childName}
                          </div>
                        )}
                        
                        {result.matchContext && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {result.matchContext}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchResults; 