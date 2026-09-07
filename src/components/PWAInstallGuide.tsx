import React, { useState } from 'react';
import { Download, Smartphone, Laptop, CheckCircle2, X, Share, PlusSquare, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallGuideProps {
  variant?: 'pill' | 'banner' | 'button';
  className?: string;
}

export const PWAInstallGuide: React.FC<PWAInstallGuideProps> = ({ variant = 'pill', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'chrome' | 'ios' | 'desktop'>(isIOS ? 'ios' : 'chrome');

  // Do not render anything if already installed as a desktop or mobile PWA app
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* 1. VARIANT RENDERING */}
      {variant === 'pill' && (
        <button
          onClick={handleInstallClick}
          className={`group flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 rounded-full text-[11px] font-semibold text-blue-800 shadow-2xs transition-all active:scale-95 cursor-pointer ${className}`}
          title="Install PSAT Master as a Native Desktop / Mobile App"
        >
          <Sparkles className="w-3 h-3 text-blue-600 animate-pulse shrink-0" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
          <Download className="w-3 h-3 text-blue-600 group-hover:translate-y-0.5 transition-transform shrink-0" />
        </button>
      )}

      {variant === 'button' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Install PSAT Master PWA</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-2xs">
              P
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Install PSAT Master for Offline Access</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Launch instantly from home screen with offline caching &amp; full screen view.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0 shadow-2xs transition-all cursor-pointer"
          >
            Get App
          </button>
        </div>
      )}

      {/* 2. WALKTHROUGH & INSTALLATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-start justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-2xl shadow-inner">
                  P
                </div>
                <div>
                  <h3 className="text-base font-bold">Install PSAT Master</h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Progressive Web Application Setup
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1">
              <button
                onClick={() => setActivePlatformTab('chrome')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activePlatformTab === 'chrome'
                    ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android / Chrome</span>
              </button>

              <button
                onClick={() => setActivePlatformTab('ios')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activePlatformTab === 'ios'
                    ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>

              <button
                onClick={() => setActivePlatformTab('desktop')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activePlatformTab === 'desktop'
                    ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Mac / PC</span>
              </button>
            </div>

            {/* Modal Body: Instructions per Platform */}
            <div className="p-5 space-y-4">

              {/* CHROME / ANDROID FLOW */}
              {activePlatformTab === 'chrome' && (
                <div className="space-y-3.5 text-xs text-slate-700">
                  {isInstallable ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Ready for Direct Installation</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Your browser supports 1-click installation. Tap the button below to add PSAT Master to your device home screen.
                      </p>
                      <button
                        onClick={async () => {
                          await install();
                          setShowModal(false);
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install App Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="font-semibold text-slate-900">Chrome &amp; Android Walkthrough:</div>
                      <ol className="space-y-2 text-slate-600 pl-1">
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Tap the <strong>three dots menu (⋮)</strong> in top right corner of Chrome.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Confirm prompt. The app icon will be added to your app list.</span>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* IOS SAFARI FLOW */}
              {activePlatformTab === 'ios' && (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl space-y-2">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Safari on iPhone &amp; iPad</span>
                    </div>
                    <p className="text-[11px] text-blue-800">
                      Apple WebKit requires manual setup via Safari toolbar:
                    </p>
                  </div>

                  <ol className="space-y-2.5 text-slate-600">
                    <li className="flex items-start gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                        <Share className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">1. Tap Share Button</div>
                        <div className="text-[11px] text-slate-500">Tap the Share icon in Safari toolbar (bottom on iPhone, top on iPad).</div>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">2. Add to Home Screen</div>
                        <div className="text-[11px] text-slate-500">Scroll down in share options and select <strong>Add to Home Screen</strong>.</div>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">3. Tap 'Add'</div>
                        <div className="text-[11px] text-slate-500">Confirm by tapping 'Add' in upper right corner.</div>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* MAC / PC DESKTOP FLOW */}
              {activePlatformTab === 'desktop' && (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900">Desktop Installation Steps:</div>
                  <ol className="space-y-2.5 text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>Look at the right side of your browser address bar (URL bar).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>Click the <strong>Install icon (monitor with down arrow)</strong> or Chrome menu <strong>⋮ &gt; Save and share &gt; Install PSAT Master</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>Confirm setup to open PSAT Master as a standalone window application.</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Benefits Checklist */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Offline Practice Access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Instant Launcher Icon</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Full Screen Exam Focus</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Zero Storage Footprint</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
