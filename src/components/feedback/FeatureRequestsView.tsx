import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  ChevronUp, 
  Plus, 
  Search, 
  Filter, 
  Lightbulb, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Users, 
  ThumbsUp,
  X,
  Send,
  HelpCircle,
  Tag
} from 'lucide-react';
import { FeatureRequest, FeatureRequestCategory, FeatureRequestStatus, UserProfile } from '../../types';
import { fetchFeatureRequests, submitFeatureRequest, toggleFeatureVote, INITIAL_FEATURE_REQUESTS } from '../../lib/firebase';

interface FeatureRequestsViewProps {
  currentUser: UserProfile | null;
  onOpenAuthModal?: () => void;
}

const CATEGORY_LABELS: Record<FeatureRequestCategory, { label: string; icon: string }> = {
  drills: { label: 'Adaptive Drills', icon: '🎯' },
  desmos: { label: 'Desmos & Math', icon: '📐' },
  gamification: { label: 'Gamification', icon: '🏆' },
  mobile: { label: 'Mobile & Offline', icon: '📱' },
  ai: { label: 'AI Explanations', icon: '🤖' },
  classroom: { label: 'Classroom & School', icon: '🏫' }
};

const STATUS_CONFIG: Record<FeatureRequestStatus, { label: string; bg: string; text: string; border: string }> = {
  under_review: {
    label: 'Under Review',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  },
  planned: {
    label: 'Planned',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200'
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  completed: {
    label: 'Shipped / Live',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  }
};

export const FeatureRequestsView: React.FC<FeatureRequestsViewProps> = ({
  currentUser
}) => {
  const [features, setFeatures] = useState<FeatureRequest[]>(INITIAL_FEATURE_REQUESTS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');

  // Submit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<FeatureRequestCategory>('drills');
  const [newTargetGroup, setNewTargetGroup] = useState<'students' | 'teachers' | 'everyone'>('students');
  const [authorName, setAuthorName] = useState(currentUser?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Voting state tracker
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  // Load features
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchFeatureRequests();
        if (mounted) {
          setFeatures(data);

          // Check user votes
          const currentUid = currentUser?.uid || localStorage.getItem('psat_guest_uid') || 'guest';
          const voted = new Set<string>();
          data.forEach((f) => {
            if (f.voterUids?.includes(currentUid)) {
              voted.add(f.id);
            }
          });
          setVotedIds(voted);
        }
      } catch (e) {
        console.warn('Feature load failed:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const handleVote = async (featureId: string) => {
    const currentUid = currentUser?.uid || localStorage.getItem('psat_guest_uid') || 'guest';
    const hasAlreadyVoted = votedIds.has(featureId);

    // Optimistic UI update
    setFeatures((prev) =>
      prev.map((f) => {
        if (f.id === featureId) {
          const newUpvotes = hasAlreadyVoted ? Math.max(0, f.upvotes - 1) : f.upvotes + 1;
          return { ...f, upvotes: newUpvotes };
        }
        return f;
      })
    );

    setVotedIds((prev) => {
      const next = new Set(prev);
      if (hasAlreadyVoted) next.delete(featureId);
      else next.add(featureId);
      return next;
    });

    try {
      await toggleFeatureVote(featureId, currentUid);
    } catch (err) {
      console.warn('Vote sync error:', err);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setIsSubmitting(true);
    const currentUid = currentUser?.uid || localStorage.getItem('psat_guest_uid') || 'guest';
    const fallbackName = authorName.trim() || currentUser?.displayName || 'PSAT Scholar';

    try {
      const created = await submitFeatureRequest({
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        status: 'under_review',
        targetGroup: newTargetGroup,
        authorName: fallbackName,
        authorUid: currentUid
      });

      setFeatures((prev) => [created, ...prev]);
      setVotedIds((prev) => new Set(prev).add(created.id));
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setNewTitle('');
        setNewDescription('');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit feature request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and sort features
  const filteredFeatures = useMemo(() => {
    return features
      .filter((f) => {
        if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
        if (selectedStatus !== 'all' && f.status !== selectedStatus) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'top') return b.upvotes - a.upvotes;
        return b.createdAt - a.createdAt;
      });
  }, [features, selectedCategory, selectedStatus, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: features.length,
      shipped: features.filter((f) => f.status === 'completed').length,
      inProgress: features.filter((f) => f.status === 'in_progress').length,
      planned: features.filter((f) => f.status === 'planned').length
    };
  }, [features]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Hero / Action Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] border border-indigo-900/50 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold border border-white/10 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Community Driven Roadmap
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            Feature Requests &amp; Ideas
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
            Vote on capabilities you want to see next or propose your own! Every vote directly steers our weekly engineering sprints for PCSS II students and teachers.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Suggest a Feature</span>
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Ideas</div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-black text-emerald-600">{stats.shipped}</div>
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">Shipped &amp; Live</div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-black text-amber-600">{stats.inProgress}</div>
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mt-0.5">In Progress</div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <div className="text-xl sm:text-2xl font-black text-indigo-600">{stats.planned}</div>
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mt-0.5">Planned Next</div>
        </div>
      </div>

      {/* Controls Bar: Search, Category, Status & Sort */}
      <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search existing feature requests (e.g. Desmos, audio, flashcards)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">Sort by:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setSortBy('top')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'top' ? 'bg-white shadow-2xs text-indigo-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top Voted
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'newest' ? 'bg-white shadow-2xs text-indigo-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Newest
              </button>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'planned', label: 'Planned' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Shipped / Live' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                selectedStatus === st.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100/70 hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider mr-1">Category:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Topics
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedCategory === catKey
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="mr-1">{info.icon}</span> {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Request Cards List */}
      {filteredFeatures.length === 0 ? (
        <div className="text-center py-16 bg-white/90 rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <Lightbulb className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">No requests found matching your filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Be the first to propose this idea! It will appear directly on the roadmap for community voting.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            + Suggest This Feature
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFeatures.map((feat) => {
            const hasVoted = votedIds.has(feat.id);
            const statusStyle = STATUS_CONFIG[feat.status] || STATUS_CONFIG.under_review;
            const categoryInfo = CATEGORY_LABELS[feat.category] || { label: feat.category, icon: '💡' };

            return (
              <div
                key={feat.id}
                className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 hover:border-indigo-200/80 transition-all flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group"
              >
                {/* Interactive Upvote Box */}
                <button
                  type="button"
                  onClick={() => handleVote(feat.id)}
                  className={`w-full sm:w-16 sm:h-20 rounded-2xl flex sm:flex-col items-center justify-center gap-1.5 p-2 transition-all cursor-pointer shrink-0 ${
                    hasVoted
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                      : 'bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-900'
                  }`}
                >
                  <ChevronUp className={`w-5 h-5 ${hasVoted ? 'stroke-[3]' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                  <span className="font-mono font-black text-sm">{feat.upvotes}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider sm:hidden ml-1">
                    {hasVoted ? 'Voted' : 'Upvote'}
                  </span>
                </button>

                {/* Content & Metadata */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {statusStyle.label}
                    </span>

                    {/* Category */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <span>{categoryInfo.icon}</span> {categoryInfo.label}
                    </span>

                    {/* Target Group */}
                    <span className="text-[11px] font-medium text-slate-500 ml-auto">
                      For: <strong className="text-slate-700 capitalize">{feat.targetGroup}</strong>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-100">
                    <span>Proposed by <strong className="text-slate-700">{feat.authorName}</strong></span>
                    <span>{new Date(feat.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Feature Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-8 space-y-6 relative animate-in zoom-in-95">
            {/* Close */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Submit to Public Roadmap
              </div>
              <h2 className="text-xl font-black text-slate-900">Suggest a New Feature</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every request is visible to the entire community and reviewed by our core curriculum team.
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="text-base font-extrabold text-emerald-900">Idea Added to Roadmap!</h3>
                <p className="text-xs text-emerald-700">
                  Your feature proposal is now live for upvoting. Closing modal...
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateFeature} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Feature Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Split-screen Desmos graphing regression table"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Category & Target Group Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as FeatureRequestCategory)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, val]) => (
                        <option key={k} value={k}>
                          {val.icon} {val.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      Target Audience
                    </label>
                    <select
                      value={newTargetGroup}
                      onChange={(e) => setNewTargetGroup(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="students">Students / Test Candidates</option>
                      <option value="teachers">Teachers / Educators</option>
                      <option value="everyone">Everyone</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Value &amp; Workflow Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Why would this feature help? How should it work during practice or timed test drills?"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Author attribution */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Your Name or Handle (Optional)
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Aarti S Ravikumar or PCSS II Junior"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !newTitle.trim() || !newDescription.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Posting Idea...' : 'Publish to Community'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
