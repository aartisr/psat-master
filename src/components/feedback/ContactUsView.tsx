import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  School, 
  Sparkles, 
  Clock, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldAlert,
  User,
  Mail,
  FileQuestion
} from 'lucide-react';
import { FeedbackReport, UserProfile } from '../../types';
import { submitFeedbackReport } from '../../lib/firebase';

interface ContactUsViewProps {
  currentUser: UserProfile | null;
  onViewTickets: () => void;
  onSwitchToBugReport: (category?: string) => void;
}

const FAQS = [
  {
    q: 'Is this question bank officially aligned with the digital PSAT 8/9, 10 & SAT?',
    a: 'Yes! Every question in this repository is mapped directly to the College Board Digital SAT Suite Assessment Framework, across Algebra, Advanced Math, Problem-Solving & Data Analysis, Geometry & Trigonometry, and Reading & Writing.'
  },
  {
    q: 'Can educators at other schools use this curriculum and drill system?',
    a: 'Absolutely. Built in dedication to Pioneer Charter School of Science II (PCSS II) in Saugus, MA, this platform is open to students and teachers everywhere. Contact us below for classroom batch exports or custom curriculum integration.'
  },
  {
    q: 'How do the 3-tiered Socratic hints work?',
    a: 'Level 1 provides a Conceptual Clue (the underlying theorem or pattern). Level 2 provides Strategic Action (the next algebraic step or desmos tip). Level 3 delivers a Targeted Nudge (the execution step right before the answer), preserving student discovery.'
  },
  {
    q: 'How can I report a typo, wrong answer key, or question graph error?',
    a: 'You can switch directly to our "Bug & Issue Reporting" tab above or click the flag icon on any question card. It will auto-populate the exact question ID for instantaneous review by our curriculum team.'
  }
];

export const ContactUsView: React.FC<ContactUsViewProps> = ({
  currentUser,
  onViewTickets,
  onSwitchToBugReport
}) => {
  const [name, setName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [inquiryType, setInquiryType] = useState<'general_contact' | 'tutoring_school' | 'question_issue'>('general_contact');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [lastDraftSaved, setLastDraftSaved] = useState<string | null>(null);

  // Auto-fill from user profile
  useEffect(() => {
    if (currentUser?.displayName && !name) setName(currentUser.displayName);
    if (currentUser?.email && !email) setEmail(currentUser.email);
  }, [currentUser]);

  // Load draft if available
  useEffect(() => {
    try {
      const draft = localStorage.getItem('psat_contact_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.subject && !subject) setSubject(parsed.subject);
        if (parsed.message && !message) setMessage(parsed.message);
        if (parsed.name && !name) setName(parsed.name);
        if (parsed.email && !email) setEmail(parsed.email);
        setLastDraftSaved('Draft restored from local session');
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!submittedTicket && (subject || message)) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem('psat_contact_draft', JSON.stringify({ name, email, subject, message }));
          setLastDraftSaved('Draft auto-saved locally');
        } catch {
          // ignore
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [name, email, subject, message, submittedTicket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    const report: FeedbackReport = {
      id: 'contact_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ticketNumber: ticketId,
      category: inquiryType,
      subject: subject.trim(),
      description: message.trim(),
      name: name.trim() || 'Student / Educator',
      email: email.trim() || 'unspecified@psatmastery.local',
      status: 'received',
      createdAt: Date.now(),
      authorUid: currentUser?.uid
    };

    try {
      await submitFeedbackReport(report);
      setSubmittedTicket(ticketId);
      localStorage.removeItem('psat_contact_draft');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicket = () => {
    if (!submittedTicket) return;
    navigator.clipboard.writeText(submittedTicket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Value Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Response Guarantee */}
        <div className="bg-white/90 backdrop-blur-sm p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Response SLA</div>
            <div className="text-sm font-extrabold text-slate-900">Under 4 Business Hours</div>
            <p className="text-xs text-slate-500 leading-relaxed">Direct support from PSAT/SAT math coaches and lead curriculum engineers.</p>
          </div>
        </div>

        {/* Card 2: PCSS II Dedicated Support */}
        <div className="bg-white/90 backdrop-blur-sm p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">School Partnerships</div>
            <div className="text-sm font-extrabold text-slate-900">PCSS II Saugus & Educators</div>
            <p className="text-xs text-slate-500 leading-relaxed">Dedicated tutoring programs, classroom sprints, and bulk question exports.</p>
          </div>
        </div>

        {/* Card 3: Ticket Tracking */}
        <div className="bg-white/90 backdrop-blur-sm p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolution Tracking</div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-slate-900">Direct Ticket System</div>
              <button
                onClick={onViewTickets}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer"
              >
                View History
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Every message receives a unique tracking code logged to your session.</p>
          </div>
        </div>
      </div>

      {/* Main Form and Side Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
              Send Us a Message
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Have a question about PSAT practice, tutoring partnership, or question explanations? We are here to help.
            </p>
          </div>

          {/* Success Banner if submitted */}
          {submittedTicket ? (
            <div className="p-6 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-3 animate-in zoom-in-95">
              <div className="flex items-center gap-2.5 text-emerald-800 font-extrabold text-base">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                Message Received Successfully!
              </div>
              <p className="text-xs sm:text-sm text-emerald-900/80 leading-relaxed">
                Thank you for reaching out. A curriculum mentor has logged your inquiry. Your reference ticket is:
              </p>
              <div className="flex items-center gap-2 bg-white/90 px-3.5 py-2 rounded-xl border border-emerald-300 w-fit">
                <span className="font-mono font-black text-emerald-900 text-sm tracking-wider">{submittedTicket}</span>
                <button
                  onClick={copyTicket}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer ml-2"
                >
                  {copiedTicket ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedTicket ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setSubmittedTicket(null)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Send Another Note
                </button>
                <button
                  onClick={onViewTickets}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  View My Tickets
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Inquiry Type Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Inquiry Topic
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInquiryType('general_contact')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      inquiryType === 'general_contact'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900 mb-0.5">
                      <MessageSquare className="w-4 h-4 text-indigo-600" /> General Inquiry
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">Questions, guidance & advice</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInquiryType('tutoring_school')}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      inquiryType === 'tutoring_school'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900 mb-0.5">
                      <School className="w-4 h-4 text-amber-600" /> School / Tutoring
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">PCSS II, classroom & coaches</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToBugReport('question_issue');
                    }}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-rose-50/60 hover:border-rose-200 text-left text-xs font-bold transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900 group-hover:text-rose-700 mb-0.5">
                      <FileQuestion className="w-4 h-4 text-rose-500" /> Question Flaw?
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">Open Bug / Error Reporter →</div>
                  </button>
                </div>
              </div>

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarti Ravikumar"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., PSAT 10 practice drill timing question or tutoring collaboration"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Your Message
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    {message.length} characters
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide as much context as possible. If this is regarding a specific PSAT test module, score range, or school program, let us know!"
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                />
              </div>

              {/* Submit Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  {lastDraftSaved || 'Changes auto-saved to device'}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !subject.trim() || !message.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-950/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending Ticket...' : 'Dispatch Message'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Information & FAQs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Dedication Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-800/60 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold backdrop-blur-xs border border-white/15">
                <School className="w-3.5 h-3.5 text-amber-300" /> Saugus, Massachusetts
              </div>
              <h3 className="text-lg font-black tracking-tight">
                Dedicated to PCSS II &amp; Aarti S Ravikumar
              </h3>
              <p className="text-xs text-indigo-200/90 leading-relaxed">
                Created with pride for the students and faculty at Pioneer Charter School of Science II. Inquiries from teachers, parent coaches, and students are given highest priority.
              </p>
              <div className="pt-2 flex flex-wrap gap-3 text-xs font-bold">
                <a
                  href="https://saugus.pioneercss.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white hover:text-amber-300 transition-colors underline underline-offset-2"
                >
                  PCSS II School Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://ai-aarti.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white hover:text-amber-300 transition-colors underline underline-offset-2"
                >
                  Aarti S Ravikumar <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            {/* Background geometric blur */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Quick FAQ Accordion */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Frequently Asked Questions</h3>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between gap-2 text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3.5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
