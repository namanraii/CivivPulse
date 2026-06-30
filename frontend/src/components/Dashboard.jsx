import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, MapPin, ThumbsUp, Activity, Filter, CopyCheck } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const CATEGORIES = ["All", "Infrastructure", "Sanitation", "Safety", "Environment", "Other"];

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  
  const [escalatingIssueId, setEscalatingIssueId] = useState(null);
  const [escalationDraft, setEscalationDraft] = useState(null);
  const [isEscalating, setIsEscalating] = useState(false);
  const [upvotingIds, setUpvotingIds] = useState(new Set());

  const handleEscalate = async (issueId) => {
    setIsEscalating(true);
    setEscalatingIssueId(issueId);
    setEscalationDraft(null);
    const toastId = toast.loading('Drafting escalation...');
    try {
      const response = await fetch(`http://localhost:8000/api/issues/${issueId}/escalate`, { method: 'POST' });
      if (!response.ok) throw new Error('Escalation failed');
      const data = await response.json();
      setEscalationDraft(data);
      toast.success('Draft generated!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate draft', { id: toastId });
    } finally {
      setIsEscalating(false);
    }
  };

  const handleUpvote = async (issueId) => {
    if (upvotingIds.has(issueId)) return;
    
    setUpvotingIds(prev => new Set(prev).add(issueId));
    try {
      const response = await fetch(`http://localhost:8000/api/issues/${issueId}/upvote`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to upvote');
      toast.success('Upvoted! Priority score recalculated.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upvote issue.');
    } finally {
      setUpvotingIds(prev => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = [];
      snapshot.forEach((doc) => {
        issuesData.push({ id: doc.id, ...doc.data() });
      });
      setIssues(issuesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredIssues = activeFilter === "All" 
    ? issues 
    : issues.filter(issue => issue.category === activeFilter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Community Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Discover and upvote civic issues in your neighborhood.</p>
        </div>
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeFilter === category 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-3xl">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl text-gray-300">No issues found</h3>
          <p className="text-gray-500 mt-2">Try selecting a different category or report a new issue.</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filteredIssues.map((issue) => (
            <motion.div key={issue.id} variants={itemVariants} className="glass-panel rounded-2xl overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                {issue.image && (
                  <img 
                    src={issue.image} 
                    alt={issue.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                
                {issue.is_duplicate && (
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                      <CopyCheck className="w-3 h-3" /> Duplicate
                    </span>
                  </div>
                )}

                <div className="absolute top-4 right-4 z-20 flex gap-2">
                  {issue.urgency_score && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-black/50 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shadow-lg">
                      <Activity className="w-3 h-3" /> Score {issue.urgency_score}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
                    issue.severity === 'High' ? 'bg-red-500/20 text-red-200 border-red-500/30' :
                    issue.severity === 'Medium' ? 'bg-orange-500/20 text-orange-200 border-orange-500/30' :
                    'bg-green-500/20 text-green-200 border-green-500/30'
                  }`}>
                    {issue.severity} Priority
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md bg-white/10 text-white border border-white/20">
                    {issue.category}
                  </span>
                </div>
              </div>
              
              <div className="p-5 space-y-4 flex flex-col h-[calc(100%-12rem)]">
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{issue.title}</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{issue.location || 'Location Pending'}</span>
                  </div>
                  {issue.is_duplicate && issue.duplicate_reasoning && (
                    <p className="text-xs text-yellow-400/80 line-clamp-2 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                      {issue.duplicate_reasoning}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button 
                    onClick={() => handleUpvote(issue.id)}
                    disabled={upvotingIds.has(issue.id)}
                    className="flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="font-semibold">{issue.upvotes || 0}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{issue.createdAt === "Just now" ? "Just now" : "Recently"}</span>
                  </div>
                </div>
                
                {issue.urgency_score > 70 && (
                  <button 
                    onClick={() => handleEscalate(issue.id)}
                    disabled={isEscalating && escalatingIssueId === issue.id}
                    className="w-full mt-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     <AlertCircle className="w-4 h-4" />
                     {isEscalating && escalatingIssueId === issue.id ? "Drafting..." : "Escalate to City Council"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {escalationDraft && !escalationDraft.error && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-400" />
                Escalation Draft Ready
              </h2>
              <div className="bg-black/40 rounded-xl p-4 border border-white/10 mb-4">
                 <p className="text-gray-400 text-sm mb-1">Subject:</p>
                 <p className="font-medium text-white">{escalationDraft.subject}</p>
              </div>
              <div className="bg-black/40 rounded-xl p-4 border border-white/10 whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                 {escalationDraft.body}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                 <button onClick={() => setEscalationDraft(null)} className="px-5 py-2 rounded-xl text-gray-400 hover:text-white transition-colors">Close</button>
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(`Subject: ${escalationDraft.subject}\n\n${escalationDraft.body}`);
                     toast.success('Copied to clipboard!');
                     setEscalationDraft(null);
                   }}
                   className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                 >
                   Copy to Email
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
