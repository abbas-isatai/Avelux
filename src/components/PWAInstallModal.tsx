import React from 'react';
import { Download, Smartphone, CheckCircle2, X, ExternalLink, ShieldCheck } from 'lucide-react';
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
              <Smartphone className="h-5 w-5 text-white" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#111827]" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Install Avelux Grand
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  APK / PWA
                </span>
              </h2>
              <p className="text-xs text-slate-400">Native standalone experience with offline review</p>
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
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="text-slate-300">
              <span className="font-semibold text-white">Stockfish 19 Engine</span> runs locally on device with instant analysis and no ads or telemetry.
            </div>
          </div>

          {isInstalled ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>Avelux Grand is already installed on this device!</span>
            </div>
          ) : isInstallable ? (
            <div className="space-y-3">
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition active:scale-[0.98]"
              >
                <Download className="h-5 w-5" />
                <span>Install Avelux Grand App (APK)</span>
              </button>
              <p className="text-[11px] text-center text-slate-400">
                Installs as a standalone APK on Android or desktop app on Chrome/Edge.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-cyan-400" />
                  {isAndroid ? 'Android Chrome / Edge Install' : isIOS ? 'Apple iOS Safari Install' : 'Browser App Install'}
                </div>
                {isIOS ? (
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                    <li>Tap the <strong className="text-white">Share</strong> button at bottom of Safari</li>
                    <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong></li>
                    <li>Launch <strong className="text-cyan-400">Avelux Grand</strong> from your home screen</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                    <li>Tap the <strong className="text-white">⋮ menu</strong> in the top right of Chrome/browser</li>
                    <li>Tap <strong className="text-white">Install App</strong> or <strong className="text-white">Add to Home screen</strong></li>
                    <li>Android will generate an official WebAPK with custom Avelux icon</li>
                  </ol>
                )}
              </div>
            </div>
          )}
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
