import React from 'react';
import { Download, Smartphone, CheckCircle2, X, ExternalLink, ShieldCheck, FileCheck, Package } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-[#111827] to-[#0A0D14] border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-950/40 text-slate-100">
        {/* Glow corner accent */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
              <Package className="h-5 w-5 text-white" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#111827]" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Avelux Grand APK & Install
              </h2>
              <p className="text-xs text-slate-400">Direct Android APK package & PWA app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          {/* Direct APK Download Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-3 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-sm text-white">Android APK Package</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Signed v1/v2/v3
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The compiled APK package is located at <code className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono text-[11px]">/public/avelux-grand.apk</code> and <code className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono text-[11px]">/avelux-grand.apk</code>.
            </p>

            {/* Direct download anchor */}
            <a
              href="/avelux-grand.apk"
              download="avelux-grand.apk"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/25 transition active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>Download avelux-grand.apk</span>
            </a>
          </div>

          {/* Standalone PWA Option */}
          {isInstallable && (
            <div className="space-y-2">
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition active:scale-[0.98]"
              >
                <Smartphone className="h-4 w-4" />
                <span>Add WebAPK to Home Screen</span>
              </button>
            </div>
          )}

          {/* Engine note */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Built with Stockfish 19 engine and local hardware acceleration.</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
