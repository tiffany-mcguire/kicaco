import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadImage, createImagePreview, validateImageFile } from '../../utils/imageUpload';

interface ImageUploadProps {
  threadId: string;
  onUploadComplete: (response: string, createdEvents?: any[], createdKeepers?: any[]) => void;
  onUploadStart?: () => void;
  onClose?: () => void;
  prompt?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  threadId,
  onUploadComplete,
  onUploadStart,
  onClose,
  prompt,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    
    try {
      const previewUrl = await createImagePreview(file);
      setPreview(previewUrl);
    } catch (err) {
      setError('Failed to create image preview');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !threadId) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    onUploadStart?.();

    let createdEvents: any[] = [];
    let createdKeepers: any[] = [];
    
    try {
      await uploadImage({
        threadId,
        imageFile: selectedFile,
        prompt,
        onProgress: setProgress,
        onSuccess: (response) => {
          onUploadComplete(response, createdEvents, createdKeepers);
          // Reset state
          setSelectedFile(null);
          setPreview(null);
          setProgress(0);
        },
        onError: setError,
        onEventsCreated: (events, keepers) => {
          createdEvents = events;
          createdKeepers = keepers;
        }
      });
    } catch (err) {
      // Error is already handled in the uploadImage function
    } finally {
      setUploading(false);
    }
  }, [selectedFile, threadId, prompt, onUploadComplete, onUploadStart]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <ImageIcon size={16} />
          Upload Image
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2"
          >
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Drop Zone */}
      {!selectedFile && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop an image here, or{' '}
            <button
              onClick={handleBrowseClick}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500">
            Supports JPG, PNG, GIF, WebP up to 20MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Image Preview */}
      {selectedFile && preview && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
            />
            {!uploading && (
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-colors"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            
            {!uploading && (
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Upload & Analyze
              </button>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading and analyzing...</span>
                <span className="text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 