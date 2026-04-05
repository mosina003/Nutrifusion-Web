'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BodyDiagram } from '@/components/acupressure/body-diagram';
import { PointDetails } from '@/components/acupressure/point-details';
import { SearchBar } from '@/components/acupressure/search-bar';
import { TherapyGuide } from '@/components/acupressure/therapy-guide';

const API_BASE_URL = 'https://nutrifusion-backend.onrender.com/api';

export default function AcupressurePage() {
  const router = useRouter();
  const [bodyPart, setBodyPart] = useState<'front' | 'back'>('front');
  const [allPoints, setAllPoints] = useState<any[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<any[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTherapyGuide, setShowTherapyGuide] = useState(false);
  const [selectedTherapyPoint, setSelectedTherapyPoint] = useState<any | null>(null);

  // Fetch all acupressure points on mount
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/acupressure-points`);
        if (!response.ok) throw new Error('Failed to fetch points');
        const data = await response.json();
        setAllPoints(data.data || []);
        setFilteredPoints(data.data || []);
        setSelectedPoint(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching points:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, []);

  // Apply filters when framework, search, or body part changes
  useEffect(() => {
    let filtered = allPoints;

    // Filter by body part
    filtered = filtered.filter(p => p.bodyPart === bodyPart);

    // Filter by search term if provided
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(point => {
        return (
          point.name.toLowerCase().includes(term) ||
          point.meridian.toLowerCase().includes(term) ||
          point.symptoms.some((s: string) => s.toLowerCase().includes(term)) ||
          point.benefits.some((b: string) => b.toLowerCase().includes(term)) ||
          point.location.toLowerCase().includes(term)
        );
      });
    }

    setFilteredPoints(filtered);
  }, [allPoints, bodyPart, searchTerm]);

  // Handle search clear
  const handleSearchClear = () => {
    setSearchTerm('');
  };

  // Handle therapy start
  const handleStartTherapy = (point: any) => {
    setSelectedTherapyPoint(point);
    setShowTherapyGuide(true);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="user">
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading acupressure points...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="user">
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="text-slate-600 dark:text-slate-400"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Acupressure Body Explorer
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Traditional Chinese Medicine — Interactive Point Map
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {filteredPoints.length} points
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {bodyPart === 'front' ? 'Front Body' : 'Back Body'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200">Error Loading Data</h3>
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mb-6 space-y-4">
            {/* Body Part Tabs */}
            <Tabs value={bodyPart} onValueChange={(val) => setBodyPart(val as 'front' | 'back')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-xs">
                <TabsTrigger value="front">Front Body</TabsTrigger>
                <TabsTrigger value="back">Back Body</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search Bar */}
            <SearchBar
              onSearch={setSearchTerm}
              onClear={handleSearchClear}
              placeholder="Search by symptom, point name, or meridian..."
            />

            {/* Results Count */}
            {searchTerm ? (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Found <span className="font-semibold text-amber-600">{filteredPoints.length}</span> matching points
              </div>
            ) : null}
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Body Diagram */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden h-96 sm:h-[500px] lg:h-[600px]">
                <BodyDiagram
                  points={filteredPoints}
                  selectedPoint={selectedPoint}
                  onPointClick={setSelectedPoint}
                  bodyPart={bodyPart}
                />
              </div>
            </div>

            {/* Right: Point Details */}
            <div className="lg:col-span-1 h-96 sm:h-[500px] lg:h-[600px]">
              <PointDetails
                point={selectedPoint}
                onStartTherapy={handleStartTherapy}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">💡 How It Works</h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Select or hover over points on the body diagram to explore their therapeutic benefits, techniques, and cultural framework mappings.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
              <h3 className="font-bold text-green-900 dark:text-green-200 mb-2">🎯 Best Practices</h3>
              <p className="text-sm text-green-800 dark:text-green-300">
                Apply firm, steady pressure for 1-2 minutes. Practice daily for best results. Consult a practitioner for persistent issues.
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-700">
              <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2">🔍 Deep Knowledge</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Each point provides detailed information on its benefits, techniques, and cultural framework mappings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Therapy Guide Dialog */}
      <TherapyGuide
        point={selectedTherapyPoint}
        isOpen={showTherapyGuide}
        onClose={() => {
          setShowTherapyGuide(false);
          setSelectedTherapyPoint(null);
        }}
      />
    </ProtectedRoute>
  );
}
