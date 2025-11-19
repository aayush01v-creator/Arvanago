import React, { useState, useEffect } from 'react';
import Icon from './common/Icon.tsx';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'terms'>('contact');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Reset to contact tab when opening
      setActiveTab('contact');
    } else {
      // Delay removing animation class
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      }`}
      style={{ animation: isOpen ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{ animation: isOpen ? 'scaleIn 0.3s ease-out' : 'scaleOut 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-brand-primary to-purple-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Information</h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30 hover:rotate-90"
              aria-label="Close modal"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'contact'
                  ? 'bg-white text-brand-primary shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon name="mail" className="h-4 w-4" />
                Contact Us
              </div>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex-1 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'terms'
                  ? 'bg-white text-brand-primary shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon name="file-text" className="h-4 w-4" />
                Terms & Conditions
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {activeTab === 'contact' ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
                  <Icon name="mail" className="h-8 w-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Get in Touch</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  We'd love to hear from you! Reach out to us for any questions or support.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
                      <Icon name="mail" className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Email</h4>
                      <a
                        href="mailto:edusimulate@sendapp.uk"
                        className="text-brand-primary hover:underline"
                      >
                        edusimulate@sendapp.uk
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
                      <Icon name="smartphone" className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Support</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        Available 24/7 for your queries
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
                      <Icon name="live" className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Response Time</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        We typically respond within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a
                  href="mailto:edusimulate@sendapp.uk"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-brand-primary/90 hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <Icon name="mail" className="h-5 w-5" />
                  Send us an Email
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
                  <Icon name="file-text" className="h-8 w-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Terms & Conditions
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Please read our terms and privacy policy carefully
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>

                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                    1. Acceptance of Terms
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    By accessing and using Edusimulate, you accept and agree to be bound by the
                    terms and provision of this agreement.
                  </p>

                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                    2. Use License
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Permission is granted to temporarily access the materials on Edusimulate for
                    personal, non-commercial transitory viewing only.
                  </p>

                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                    3. Privacy Policy
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your privacy is important to us. We collect and use your personal information
                    in accordance with our Privacy Policy.
                  </p>

                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                    4. User Responsibilities
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    You are responsible for maintaining the confidentiality of your account and
                    password and for restricting access to your computer.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <a
                  href="https://www.freeprivacypolicy.com/live/6e77247b-f87d-45f6-8c8d-88e77554b487"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-brand-primary/90 hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <Icon name="file-text" className="h-5 w-5" />
                  View Full Policy
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes scaleOut {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.95);
            opacity: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default InfoModal;
