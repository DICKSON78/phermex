import { useState, useEffect } from 'react';
import { X, Download, Smartphone, CheckCircle, Share, MoreVertical } from 'lucide-react';

function getBrowser() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) return 'chrome';
  if (/Firefox/.test(ua)) return 'firefox';
  return 'other';
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const browser = getBrowser();

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) { setInstalled(true); return; }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 2500);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShow(false);
    });

    const t = setTimeout(() => setShow(true), 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(t);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { setInstalled(true); setShow(false); }
    setDeferredPrompt(null);
  };

  if (!show || installed) return null;

  const canNative = !!deferredPrompt;
  const isIOS = browser === 'ios';

  return (
    <div className="fixed inset-0 z-[6000] flex items-end justify-center" onClick={() => setShow(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-[28px] w-full max-w-lg p-6 pb-8 animate-slide-up safe-area-bottom" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:scale-95">
          <X size={14} className="text-gray-500" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#0FD452]/10 rounded-[20px] flex items-center justify-center mb-4">
            <Smartphone size={28} className="text-[#0FD452]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Install Pharmex</h3>
          <p className="text-sm text-gray-500 mb-1">Add to your home screen for faster access</p>

          <div className="flex items-center gap-4 my-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#0FD452]" /><span>Offline</span></div>
            <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#0FD452]" /><span>Faster</span></div>
            <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#0FD452]" /><span>App icon</span></div>
          </div>

          {canNative ? (
            <button onClick={handleInstall} className="w-full bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-2xl font-bold text-sm py-4 flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-sm shadow-[#0FD452]/20">
              <Download size={18} /> Install Now
            </button>
          ) : (
            <div className="w-full space-y-2.5">
              {isIOS ? (
                <>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm"><Share size={14} className="text-gray-600" /></div>
                      <div className="text-left"><p className="text-xs font-bold text-gray-900">1. Tap the Share button</p><p className="text-[10px] text-gray-400 mt-0.5">Bottom of Safari — square with up arrow</p></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm"><span className="text-xs font-bold text-gray-600">+</span></div>
                      <div className="text-left"><p className="text-xs font-bold text-gray-900">2. Select "Add to Home Screen"</p><p className="text-[10px] text-gray-400 mt-0.5">Scroll down and tap it</p></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm"><MoreVertical size={14} className="text-gray-600" /></div>
                      <div className="text-left"><p className="text-xs font-bold text-gray-900">1. Tap the menu (3 dots / dots icon)</p><p className="text-[10px] text-gray-400 mt-0.5">Top or bottom corner of your browser</p></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm"><Download size={14} className="text-gray-600" /></div>
                      <div className="text-left"><p className="text-xs font-bold text-gray-900">2. Tap "Install app" or "Add to Home screen"</p><p className="text-[10px] text-gray-400 mt-0.5">Pharmex will appear on your home screen</p></div>
                    </div>
                  </div>
                </>
              )}
              <button onClick={() => setShow(false)} className="w-full bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-2xl font-bold text-sm py-4 active:scale-[0.97] transition-all">Got it</button>
            </div>
          )}

          <button onClick={() => setShow(false)} className="mt-3 text-xs font-medium text-gray-400 active:scale-95">No thanks</button>
        </div>
      </div>
    </div>
  );
}
