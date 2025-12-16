// guestsense-ui/components/InsightSummary.tsx
'use client';

import React, { useState, useEffect } from 'react';

// Define the TypeScript interface for the Insight model
interface Insight {
  id: string; // Changed from number to string to match the uuid4 in Python
  text: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
}

const API_URL = 'http://localhost:8000/api/v1/insights';

// NOTE: The component no longer accepts any props
const InsightSummary: React.FC = () => { 
  const [liveInsights, setLiveInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Insight[] = await response.json();
        setLiveInsights(data);
      } catch (e: any) {
        setError(`Failed to fetch insights: ${e.message}. Is the backend running and accessible at ${API_URL}?`);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []); // Run once on mount

  if (loading) return <p className="text-center py-4 text-gray-500">Synthesizing high-level insights...</p>;
  if (error) return <p className="text-red-600 border border-red-200 p-4 rounded">{error}</p>;
  if (liveInsights.length === 0) return <p className="text-gray-500 py-4">No high-level insights available yet. Ingest some feedback!</p>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {liveInsights.map(insight => (
        <div 
          key={insight.id} 
          className={`p-5 rounded-xl shadow-lg transition duration-300 transform hover:scale-[1.02] 
            ${insight.sentiment === 'Negative' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500'}`}
        >
          <p className="font-bold text-lg mb-2">
            {insight.sentiment} Insight:
          </p>
          <p className="text-gray-800">
            {insight.text}
          </p>
        </div>
      ))}
    </div>
  );
};

export default InsightSummary;