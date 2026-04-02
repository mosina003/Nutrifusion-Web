import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface TherapyGuideProps {
  point: any;
  isOpen: boolean;
  onClose: () => void;
  therapyWarmAlert?: string; // Optional warming message
}

export const TherapyGuide: React.FC<TherapyGuideProps> = ({
  point,
  isOpen,
  onClose,
  therapyWarmAlert,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(120); // 2 minutes default
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setCompleted(true);
            // Play a sound or show notification
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, remainingTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((120 - remainingTime) / 120) * 100;

  const handleReset = () => {
    setRemainingTime(120);
    setCompleted(false);
    setIsRunning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Therapy Session: {point?.name}</span>
          </DialogTitle>
        </DialogHeader>

        {!completed ? (
          <div className="space-y-6">
            {/* Point Info */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                {point?.location}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300">{point?.technique}</p>
            </div>

            {/* Warnings/Info */}
            {therapyWarmAlert && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">{therapyWarmAlert}</p>
              </div>
            )}

            {/* Timer Display */}
            <div className="text-center">
              <div className="text-5xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                {formatTime(remainingTime)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Time remaining</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {Math.round(progressPercent)}% complete
              </p>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Reset
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 text-sm">
                How to Apply Pressure:
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                <li>✓ Use your thumb or index finger</li>
                <li>✓ Apply steady, firm pressure</li>
                <li>✓ Use circular motions gently</li>
                <li>✓ Stop if you feel sharp pain</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            {/* Completion Animation */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce mb-2">
                <Check className="w-10 h-10 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                Great Job!
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm">
                You've completed a full therapy session for{' '}
                <span className="font-semibold">{point?.name}</span>.
              </p>
            </div>

            {/* Tips */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700 text-left">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2 text-sm">
                For Best Results:
              </h4>
              <ul className="text-xs text-green-800 dark:text-green-300 space-y-1">
                <li>• Repeat this session 1-2 times daily</li>
                <li>• Maintain consistent pressure</li>
                <li>• Stay hydrated after therapy</li>
                <li>• Results develop over weeks</li>
              </ul>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Close & Continue Exploring
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
