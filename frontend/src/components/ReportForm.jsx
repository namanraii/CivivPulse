import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Loader2, Sparkles, AlertCircle, CheckCircle2, CopyCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportForm() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Reset state if selecting a new image
      setAnalysisResult(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setError(null);
    const toastId = toast.loading('Uploading and analyzing image...');
    
    const formData = new FormData();
    formData.append('image', image);
    if (description) {
      formData.append('description', description);
    }

    try {
      const response = await fetch('http://localhost:8000/api/issues', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Submission failed');
      
      const data = await response.json();
      setAnalysisResult(data);
      
      if (data.is_duplicate) {
        toast.error('Flagged as potential duplicate.', { id: toastId, icon: '⚠️' });
      } else {
        toast.success('Issue reported successfully!', { id: toastId });
      }
      
    } catch (err) {
      setError(err.message || 'Failed to connect to backend');
      toast.error('Failed to submit issue.', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Report an Issue
        </h1>
        <p className="text-gray-400 mt-3 text-lg">
          Snap a photo and let our AI instantly categorize and describe the civic issue.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input Form */}
        <motion.div 
          className="glass-panel p-6 rounded-3xl space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* Image Upload Area */}
          <div 
            className="relative h-64 rounded-2xl border-2 border-dashed border-white/20 bg-black/20 flex flex-col items-center justify-center cursor-pointer hover:bg-black/30 transition-colors overflow-hidden group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
            />
            
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-white font-medium">Click to upload photo</p>
                <p className="text-sm text-gray-400 mt-1">JPEG, PNG up to 10MB</p>
              </div>
            )}
            
            {previewUrl && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="glass-button px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Change Photo
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Details (Optional)
            </label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              placeholder="e.g. It's right in front of the coffee shop..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!image || isAnalyzing}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              !image ? 'bg-white/5 text-gray-500 cursor-not-allowed' :
              isAnalyzing ? 'bg-indigo-600/50 text-indigo-200' :
              'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
            }`}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting & Analyzing...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Submit Issue</>
            )}
          </button>
        </motion.div>

        {/* Right Column: AI Analysis Result */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {!analysisResult && !error && !isAnalyzing && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 glass-panel rounded-3xl flex flex-col items-center justify-center text-center p-8 border-dashed border-2 border-white/10"
              >
                <Sparkles className="w-12 h-12 text-indigo-500/30 mb-4" />
                <h3 className="text-xl font-medium text-gray-400">Awaiting Analysis</h3>
                <p className="text-sm text-gray-500 mt-2">Upload a photo to see the AI agent magically extract details.</p>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 glass-panel rounded-3xl flex flex-col items-center justify-center p-8 border border-indigo-500/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4 relative z-10" />
                <h3 className="text-xl font-medium text-indigo-200 relative z-10">Gemini is looking...</h3>
              </motion.div>
            )}

            {error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 glass-panel bg-red-500/10 border-red-500/30 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
              >
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-red-200">{error}</h3>
                <p className="text-sm text-red-400/70 mt-2">Make sure the FastAPI backend is running.</p>
              </motion.div>
            )}

            {analysisResult && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl p-6 relative overflow-hidden h-full flex flex-col"
              >
                <div className="absolute top-0 right-0 p-4">
                  {analysisResult.is_duplicate ? (
                    <CopyCheck className="w-6 h-6 text-yellow-400" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  )}
                </div>
                
                <div className="space-y-5 relative z-10 flex-grow">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">AI Extracted Title</span>
                    <h2 className="text-2xl font-bold text-white mt-1 line-clamp-2">{analysisResult.title}</h2>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                      <span className="block text-xs text-gray-500 mb-1">Category</span>
                      <span className="font-medium text-white text-sm">{analysisResult.category}</span>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                      <span className="block text-xs text-gray-500 mb-1">Severity</span>
                      <span className={`font-medium text-sm ${
                        analysisResult.severity === 'High' ? 'text-red-400' : 
                        analysisResult.severity === 'Medium' ? 'text-orange-400' : 'text-green-400'
                      }`}>{analysisResult.severity}</span>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-indigo-500/30">
                      <span className="block text-xs text-indigo-400 mb-1">Urgency</span>
                      <span className="font-bold text-white text-lg">{analysisResult.urgency_score}/100</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Formal Description</span>
                    <p className="text-gray-300 mt-2 text-sm leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 line-clamp-3 overflow-y-auto">
                      {analysisResult.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                </div>

                <div className="mt-6">
                  {analysisResult.is_duplicate ? (
                    <div className="w-full bg-yellow-500/10 border border-yellow-500/30 py-3 px-4 rounded-xl font-medium text-yellow-400 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <AlertCircle className="w-4 h-4" /> Flagged as Duplicate
                      </div>
                      <p className="text-xs text-yellow-400/80">{analysisResult.duplicate_reasoning}</p>
                    </div>
                  ) : (
                    <div className="w-full bg-green-500/10 border border-green-500/30 py-3 rounded-xl font-medium text-green-400 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Issue Successfully Saved!
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
