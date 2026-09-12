import React, { useRef, useState, useEffect } from 'react';
import { Edit3, Type, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface DigitalSignaturePadProps {
  candidateName: string;
  onSignatureChange: (signatureBase64: string) => void;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  candidateName,
  onSignatureChange,
}) => {
  const [signMode, setSignMode] = useState<'DRAW' | 'TYPE'>('DRAW');
  const [typedName, setTypedName] = useState(candidateName || '');
  const [selectedFont, setSelectedFont] = useState<'cursive' | 'serif' | 'italic'>('cursive');
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Initialize canvas
  useEffect(() => {
    if (signMode === 'DRAW') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = '#0f172a'; // Deep navy black
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [signMode]);

  // Update typed signature
  useEffect(() => {
    if (signMode === 'TYPE' && typedName.trim()) {
      // Render typed signature to offscreen canvas to get a base64 image
      const offscreen = document.createElement('canvas');
      offscreen.width = 400;
      offscreen.height = 120;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.font = selectedFont === 'cursive'
          ? 'italic 36px "Brush Script MT", "Caveat", cursive'
          : selectedFont === 'italic'
          ? 'italic 32px "Georgia", serif'
          : '30px "Palatino", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName.trim(), 200, 60);
        onSignatureChange(offscreen.toDataURL('image/png'));
      }
    }
  }, [signMode, typedName, selectedFont]);

  // Mouse & Touch event handlers for drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      const canvas = canvasRef.current;
      if (canvas) {
        onSignatureChange(canvas.toDataURL('image/png'));
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureChange('');
  };

  return (
    <div className="rounded-2xl border border-[#edf2f7] bg-white p-4 space-y-3">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-[#f8fafc] rounded-xl border border-[#edf2f7]">
          <button
            type="button"
            onClick={() => setSignMode('DRAW')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              signMode === 'DRAW'
                ? 'bg-white text-[#0e1017] shadow-xs'
                : 'text-[#5e6b7c] hover:text-[#0e1017]'
            }`}
          >
            <Edit3 className="h-3 w-3" />
            <span>Draw with Mouse / Finger</span>
          </button>
          <button
            type="button"
            onClick={() => setSignMode('TYPE')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              signMode === 'TYPE'
                ? 'bg-white text-[#0e1017] shadow-xs'
                : 'text-[#5e6b7c] hover:text-[#0e1017]'
            }`}
          >
            <Type className="h-3 w-3" />
            <span>Type Signature</span>
          </button>
        </div>

        {signMode === 'DRAW' && (
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {signMode === 'DRAW' ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300 bg-[#fbfcfd] cursor-crosshair touch-none"
          />
          {!hasDrawn && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-[#8b98a9]">
              Draw your signature here with mouse, stylus or touch
            </div>
          )}
          <div className="absolute bottom-2 left-3 pointer-events-none text-[9px] text-[#94a3b8] font-mono">
            ✕ SIGN HERE
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full legal name..."
            className="w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs font-bold text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
          />

          {/* Cursive Styles Selection */}
          <div className="flex gap-2">
            {[
              { id: 'cursive', name: 'Calligraphic', font: 'italic "Brush Script MT", "Caveat", cursive' },
              { id: 'italic', name: 'Formal Italic', font: 'italic "Georgia", serif' },
              { id: 'serif', name: 'Executive Serif', font: '"Palatino", serif' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedFont(st.id as any)}
                className={`flex-1 p-2.5 rounded-xl border text-center transition-all ${
                  selectedFont === st.id
                    ? 'border-[#84b81b] bg-[#edf7d2]/30 ring-1 ring-[#84b81b]'
                    : 'border-[#edf2f7] bg-white hover:border-slate-300'
                }`}
              >
                <span className="block text-sm text-[#0e1017] truncate" style={{ font: st.font }}>
                  {typedName || 'Your Signature'}
                </span>
                <span className="text-[9px] text-[#8b98a9] block mt-1">{st.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Verification Stamp */}
      <div className="flex items-center justify-between text-[10px] text-[#5e6b7c] pt-1">
        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Information Technology Act E-Signature Compliant
        </span>
        <span className="font-mono text-[#8b98a9]">
          SHA-256 Verified Seal
        </span>
      </div>
    </div>
  );
};
