'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Timer, X, RotateCcw, Play, Pause, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

type Phase = 'work' | 'break';

const WORK_SECS  = 25 * 60;
const BREAK_SECS = 5  * 60;

export function PomodoroTimer() {
  const [open, setOpen]       = useState(false);
  const [phase, setPhase]     = useState<Phase>('work');
  const [remaining, setRemaining] = useState(WORK_SECS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const reset = useCallback((p: Phase = phase) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(p === 'work' ? WORK_SECS : BREAK_SECS);
  }, [phase]);

  const switchPhase = useCallback((next: Phase) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setPhase(next);
    setRemaining(next === 'work' ? WORK_SECS : BREAK_SECS);

    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      new Notification(next === 'break' ? '☕ Break time!' : '🎯 Focus time!', {
        body: next === 'break' ? 'Take a 5-minute break.' : 'Back to work for 25 minutes.',
        icon: '/favicon.ico',
      });
    }
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          switchPhase(phase === 'work' ? 'break' : 'work');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase, switchPhase]);

  // Request notification permission when opened
  useEffect(() => {
    if (open && typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [open]);

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const total = phase === 'work' ? WORK_SECS : BREAK_SECS;
  const progress = ((total - remaining) / total) * 100;

  const circumference = 2 * Math.PI * 36; // r=36

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Pomodoro Timer"
        className={cn(
          'fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-colors',
          running
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border text-muted-foreground hover:text-foreground',
        )}
      >
        <Timer className="h-5 w-5" />
        {running && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
        )}
      </button>

      {/* Timer panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-64 rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {phase === 'work' ? '🎯 Focus' : '☕ Break'}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 hover:bg-accent transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Timer display */}
          <div className="flex flex-col items-center gap-4 p-5">
            {/* SVG circle progress */}
            <div className="relative flex items-center justify-center">
              <svg width="88" height="88" className="-rotate-90">
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-muted/30"
                />
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress / 100)}
                  strokeLinecap="round"
                  className={cn(
                    'transition-all duration-1000',
                    phase === 'work' ? 'text-primary' : 'text-green-500',
                  )}
                />
              </svg>
              <span className="absolute text-xl font-mono font-semibold">
                {mins}:{secs}
              </span>
            </div>

            {/* Phase tabs */}
            <div className="flex w-full gap-1 rounded-lg bg-muted p-1">
              {(['work', 'break'] as Phase[]).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPhase(p); reset(p); }}
                  className={cn(
                    'flex-1 rounded-md py-1 text-xs font-medium transition-colors capitalize',
                    phase === p
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p === 'work' ? '25m Work' : '5m Break'}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => reset()}
                className="rounded-lg border border-border p-2 hover:bg-accent transition-colors"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setRunning((r) => !r)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  running
                    ? 'bg-muted text-foreground hover:bg-muted/80'
                    : 'bg-primary text-primary-foreground hover:opacity-90',
                )}
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? 'Pause' : 'Start'}
              </button>

              <button
                onClick={() => switchPhase(phase === 'work' ? 'break' : 'work')}
                className="rounded-lg border border-border p-2 hover:bg-accent transition-colors"
                title="Switch phase"
              >
                <Coffee className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
