import React from 'react';
import { AlertCircle, Zap, Heart, BookOpen, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PointDetailsProps {
  point: any | null;
  onStartTherapy?: (point: any) => void;
}

export const PointDetails: React.FC<PointDetailsProps> = ({
  point,
  onStartTherapy,
}) => {
  if (!point) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Point Details
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Select or hover over a pressure point to explore its details, techniques, and framework mappings.
        </p>
      </div>
    );
  }

  const { 
    ayurveda, unani, tcm, modern 
  } = point.frameworkMapping || {};
  
  const pressureTechnique = point.pressureTechnique || {};

  return (
    <ScrollArea className="h-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="p-6 space-y-6">
        {/* Header with Point Name */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {point.name}
              </h2>
              {point.chinese && (
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {point.chinese} {point.pinyin}
                </p>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{point.detailedLocation || point.location}</p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 px-3 py-1 rounded-full">
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {point.id}
                </span>
              </div>
            </div>
          </div>

          {/* Meridian & Classification Info */}
          <div className="flex gap-2 flex-wrap items-center">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
              🔗 {point.meridian} {point.meridianAbbr && `(${point.meridianAbbr})`}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">·</span>
            <Badge 
              variant="outline"
              className={`${
                point.type === 'Yang' 
                  ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                  : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
              }`}
            >
              {point.type}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">·</span>
            <Badge 
              variant="outline"
              className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300"
            >
              {point.element}
            </Badge>
          </div>
        </div>

        {/* Symptoms */}
        {point.symptoms && point.symptoms.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Symptoms</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {point.symptoms.map((symptom: string, idx: number) => (
                <div
                  key={idx}
                  className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 px-2 py-1 rounded text-xs font-medium"
                >
                  {symptom}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modern Uses */}
        {point.modernUses && point.modernUses.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-700">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="font-semibold text-cyan-900 dark:text-cyan-200">Modern Uses</h3>
            </div>
            <ul className="space-y-1">
              {point.modernUses.map((use: string, idx: number) => (
                <li key={idx} className="text-sm text-cyan-800 dark:text-cyan-300 flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  {use}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {point.benefits && point.benefits.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Benefits</h3>
            </div>
            <ul className="space-y-2">
              {point.benefits.map((benefit: string, idx: number) => (
                <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Indications */}
        {point.indications && point.indications.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2 text-sm">Indications</h3>
            <div className="flex flex-wrap gap-2">
              {point.indications.map((indication: string, idx: number) => (
                <span key={idx} className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                  {indication}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pressure Technique */}
        {(point.pressureTechnique || point.technique) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-200">🤲 Pressure Technique</h3>
            </div>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              {pressureTechnique.method && (
                <div>
                  <span className="font-semibold">Method:</span> {pressureTechnique.method}
                </div>
              )}
              {pressureTechnique.duration && (
                <div>
                  <span className="font-semibold">Duration:</span> {pressureTechnique.duration}
                </div>
              )}
              {pressureTechnique.intensity && (
                <div>
                  <span className="font-semibold">Intensity:</span> {pressureTechnique.intensity}
                </div>
              )}
              {pressureTechnique.frequency && (
                <div>
                  <span className="font-semibold">Frequency:</span> {pressureTechnique.frequency}
                </div>
              )}
              {!pressureTechnique.method && point.technique && (
                <p>{point.technique}</p>
              )}
            </div>
          </div>
        )}

        {/* Cautions */}
        {point.cautions && point.cautions.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-red-900 dark:text-red-200">⚠️ Cautions</h3>
            </div>
            <ul className="space-y-1">
              {point.cautions.map((caution: string, idx: number) => (
                <li key={idx} className="text-sm text-red-800 dark:text-red-300">
                  • {caution}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Points */}
        {point.relatedPoints && point.relatedPoints.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Related Points</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {point.relatedPoints.map((relatedId: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600">
                  {relatedId}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Framework Mappings */}
        {point.frameworkMapping && (
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Framework Mappings</h3>
            <div className="grid grid-cols-1 gap-2">
              {ayurveda && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-700">
                  <div className="text-xs font-bold text-yellow-900 dark:text-yellow-300">🍃 Ayurveda</div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">{ayurveda}</div>
                </div>
              )}
              {unani && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded border border-emerald-200 dark:border-emerald-700">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">⚖️ Unani</div>
                  <div className="text-sm text-emerald-800 dark:text-emerald-200">{unani}</div>
                </div>
              )}
              {tcm && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-700">
                  <div className="text-xs font-bold text-red-900 dark:text-red-300">🐉 TCM</div>
                  <div className="text-sm text-red-800 dark:text-red-200">{tcm}</div>
                </div>
              )}
              {modern && (
                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded border border-slate-300 dark:border-slate-600">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-200">🔬 Modern</div>
                  <div className="text-sm text-slate-800 dark:text-slate-300">{modern}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {onStartTherapy && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              onClick={() => onStartTherapy(point)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg font-semibold"
            >
              Start Pressure Therapy ▶️
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
