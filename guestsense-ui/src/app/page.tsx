// guestsense-ui/app/page.tsx
import React from 'react';
import TaskList from '../components/TaskList';
import InsightSummary from '../components/InsightSummary';

// DELETE THE mockInsights BLOCK HERE

const ManagerDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800">
        GuestSense Manager Dashboard
      </h1>

      {/* Insight Summary Component */}
      <div className="mb-8">
        {/* REMOVE insights={mockInsights} */}
        <InsightSummary /> 
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">
        Actionable Tasks
      </h2>

      {/* Task List Component (Will handle API call) */}
      <TaskList />

      <p className="mt-8 text-sm text-gray-500">
        To submit new feedback, visit the <a href="/ingest" className="text-blue-500 hover:underline">Ingestion Page</a>.
      </p>
    </div>
  );
};

export default ManagerDashboard;