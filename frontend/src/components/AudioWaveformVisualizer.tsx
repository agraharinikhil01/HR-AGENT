import React, { useEffect, useRef } from 'react';

interface AudioWaveformVisualizerProps {
  isRecording: boolean;
  audioStream?: MediaStream | null;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isRecording,
  audioStream,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    if (isRecording && audioStream) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source = audioCtx.createMediaStreamSource(audioStream);
        source.connect(analyser);
      } catch (e) {
        console.warn('Web Audio API stream connection fallback:', e);
      }
    }

    const bufferLength = analyser ? analyser.frequencyBinCount : 24;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else if (isRecording) {
        // Organic pseudo waveform simulation if mic stream not directly piped
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.floor(Math.sin(Date.now() / 200 + i) * 60 + 100);
        }
      } else {
        // Flat resting line
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 10;
        }
      }

      const barWidth = (canvas.width / bufferLength) * 0.7;
      const barGap = (canvas.width / bufferLength) * 0.3;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = isRecording
          ? Math.max(6, (dataArray[i] / 255) * canvas.height * 0.9)
          : 4;

        // Gradient: Olive Lime green
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#84b81b');
        grad.addColorStop(1, '#a3e635');

        ctx.fillStyle = isRecording ? grad : '#cbd5e1';
        const y = (canvas.height - barHeight) / 2;

        // Rounded bar with browser fallback
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x, y, barWidth, barHeight, 4);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();

        x += barWidth + barGap;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (source) source.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [isRecording, audioStream]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-3 bg-[#f8fafc] rounded-2xl border border-[#edf2f7]">
      <canvas
        ref={canvasRef}
        width={360}
        height={64}
        className="w-full h-16 max-w-sm"
      />
      <div className="flex items-center gap-2 mt-2 text-[10px] font-bold">
        {isRecording ? (
          <>
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-600 uppercase tracking-wider">
              Recording Live Audio & Speech Recognition Active
            </span>
          </>
        ) : (
          <span className="text-[#8b98a9] uppercase tracking-wider">
            Microphone Standby • Click Record to Speak
          </span>
        )}
      </div>
    </div>
  );
};
