'use client'; 

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface RawFeedback {
    id: string;
    source: string;
    text: string;
    timestamp: string;
}

const IngestPage: React.FC = () => {
    const [feedbackText, setFeedbackText] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // 🎯 REVERTING TO 8000 AND USING 127.0.0.1 FOR MAXIMUM RELIABILITY
   const API_URL = 'http://localhost:8000/api/v1/ingest_and_synthesize';

    const handleIngest = async () => {
        if (!feedbackText.trim()) {
            setStatus('Error: Please enter some feedback.');
            return;
        }

        setLoading(true);
        setStatus('Sending feedback to GuestSense AI...');

        const feedbackBatch: RawFeedback[] = feedbackText.split('\n')
            .filter(line => line.trim() !== '')
            .map(text => ({
                id: uuidv4(),
                source: 'Manual Test',
                text: text.trim(),
                timestamp: new Date().toISOString(),
            }));

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackBatch),
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Success! Generated ${data.tasks_to_create.length} tasks.`);
                setFeedbackText('');
                router.push('/'); 
            } else {
                const errorData = await response.json();
                setStatus(`Backend Error: ${response.status} - ${errorData.detail || 'Failed'}`);
            }

        } catch (error) {
            console.error('Fetch error:', error);
            setStatus(`Connection Error: Could not reach the API at ${API_URL}. Check Docker logs.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">GuestSense Feedback Ingestion</h1>
            <textarea
                className="w-full p-3 border rounded-lg"
                rows={10}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Type guest feedback here..."
                disabled={loading}
            />
            <button
                onClick={handleIngest}
                disabled={loading}
                className={`mt-4 w-full px-4 py-2 text-white rounded-lg ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {loading ? 'Processing...' : 'Send to GuestSense'}
            </button>
            {status && <div className="mt-4 p-4 bg-gray-100 rounded-lg">{status}</div>}
        </div>
    );
};

export default IngestPage;