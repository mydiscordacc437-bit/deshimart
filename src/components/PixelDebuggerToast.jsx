// src/components/PixelDebuggerToast.jsx
import React, { useState, useEffect } from 'react';

export default function PixelDebuggerToast({ isEnabled = false }) {
  const [eventsList, setEventsList] = useState([]);

  useEffect(() => {
    if (!isEnabled) {
      setEventsList([]);
      return;
    }

    const handleDebugEvent = (e) => {
      const detail = e.detail;
      const id = Date.now() + Math.random();
      const newEvent = { id, ...detail };

      setEventsList(prev => [newEvent, ...prev.slice(0, 3)]); // Keep up to 3 recent

      setTimeout(() => {
        setEventsList(prev => prev.filter(item => item.id !== id));
      }, 4500);
    };

    window.addEventListener('pixel-debug-event', handleDebugEvent);
    return () => window.removeEventListener('pixel-debug-event', handleDebugEvent);
  }, [isEnabled]);

  if (!isEnabled || eventsList.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
      {eventsList.map((ev) => {
        const val = ev.eventData?.value ? ` (৳${ev.eventData.value})` : '';
        return (
          <div
            key={ev.id}
            className="pointer-events-auto bg-slate-900/95 text-white border-2 border-emerald-500 rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs animate-in slide-in-from-left duration-200"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <div>
                <div className="font-extrabold text-emerald-300 flex items-center gap-1.5 font-mono">
                  <span>🎯 {ev.platform || 'FB Pixel'}:</span>
                  <span className="text-white">{ev.eventName}{val}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {ev.time} • Event tracked successfully
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEventsList(prev => prev.filter(item => item.id !== ev.id))}
              className="text-slate-400 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
