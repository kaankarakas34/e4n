
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Play, Pause, RotateCcw, Volume2, Maximize } from 'lucide-react';

export function MeetingTimer() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [duration, setDuration] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const intervalRef = useRef<any>(null);

  // Audio context for beep (simple browser API) or loaded file
  // For simplicity, visual cues only or simple console beep if possible. 
  // Real browser beep requires AudioContext.

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Play sound?
      try {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play().catch(e => console.log('Audio error', e));
      } catch { }
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const setPreset = (seconds: number) => {
    setIsActive(false);
    setDuration(seconds);
    setTimeLeft(seconds);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // calculate progress for ring or bar
  const progress = (timeLeft / duration) * 100;

  // Color logic
  let colorClass = 'text-green-600';
  if (timeLeft < duration * 0.3) colorClass = 'text-red-600 animate-pulse';
  else if (timeLeft < duration * 0.5) colorClass = 'text-yellow-600';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>

      <div className="absolute top-4 right-4 flex space-x-2">
        <Button onClick={toggleFullScreen} variant="outline" className="bg-white/10 text-white border-transparent hover:bg-white/20">
          <Maximize className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-8 w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Toplantı Zamanlayıcı</h1>

        {/* Timer Display */}
        <div className={`relative flex items-center justify-center rounded-full border-8 border-gray-700 w-80 h-80 mx-auto bg-gray-800 shadow-2xl transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
          {/* Progress Circle SVG could go here for fancy UI */}
          <div className="text-center z-10">
            <div className={`text-7xl font-mono font-bold tracking-wider ${colorClass} transition-colors duration-500`}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-gray-400 mt-2 font-medium uppercase tracking-widest text-sm">
              {isActive ? 'Süre İşliyor' : 'Duraklatıldı'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-6">
          <Button
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isActive ? <Pause className="w-10 h-10 text-white" /> : <Play className="w-10 h-10 text-white ml-1" />}
          </Button>
          <Button
            onClick={resetTimer}
            className="w-20 h-20 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
          >
            <RotateCcw className="w-10 h-10 text-white" />
          </Button>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Button onClick={() => setPreset(60)} variant={duration === 60 ? 'primary' : 'secondary'} className="h-12 text-lg">
            60 Saniye
          </Button>
          <Button onClick={() => setPreset(45)} variant={duration === 45 ? 'primary' : 'secondary'} className="h-12 text-lg">
            45 Saniye
          </Button>
          <Button onClick={() => setPreset(30)} variant={duration === 30 ? 'primary' : 'secondary'} className="h-12 text-lg">
            30 Saniye
          </Button>
          <Button onClick={() => setPreset(600)} variant={duration === 600 ? 'primary' : 'secondary'} className="h-12 text-lg">
            10 Dakika
          </Button>
        </div>
      </div>
    </div>
  );
}
