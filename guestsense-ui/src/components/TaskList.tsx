// guestsense-ui/components/TaskList.tsx

'use client';

import React, { useState, useEffect } from 'react';

// Define the Task structure based on the backend Pydantic model
interface TaskTicket {
  task_id: string;
  summary: string; 
  details: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Complete';
  source_feedback_id: string; // The ID of the raw feedback that generated this
}

const API_URL = 'http://localhost:8000/api/v1/tasks'; 
const API_URL_UPDATE = 'http://localhost:8000/api/v1/tasks';

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<TaskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Used to re-fetch data

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Use host.docker.internal for accessing the Docker backend
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: TaskTicket[] = await response.json();
        setTasks(data);
      } catch (e: any) {
        setError(`Failed to fetch tasks: ${e.message}. Check Docker and API host settings.`);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [refreshKey]); // Refetch when refreshKey changes

  const handleMarkComplete = async (taskId: string) => {
    try {
      const response = await fetch(`${API_URL_UPDATE}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Complete' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task status: ${response.status}`);
      }

      // Refresh the task list by updating the refreshKey
      setRefreshKey(prev => prev + 1);

    } catch (e: any) {
      alert(`Error completing task: ${e.message}`);
    }
  };

  if (loading) return <p className="text-gray-500">Loading tasks...</p>;
  if (error) return <p className="text-red-600 border border-red-200 p-4 rounded">{error}</p>;
  if (tasks.length === 0) return <p className="text-gray-500 py-4">All pending tasks are complete!</p>;

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.task_id} className="p-4 bg-white shadow-lg rounded-lg flex justify-between items-center">
          
          {/* LEFT SIDE: Task Summary and Details */}
          <div className="flex-grow">
            {/* The main task summary (the issue description) */}
            <p className="font-semibold text-xl text-gray-800 mb-1">{task.summary}</p>
            <p className="text-sm text-gray-600 mb-2 italic">Details: {task.details}</p>
            
            {/* Metadata (Status and Priority Badges) */}
            <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${task.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                    Status: {task.status}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${task.priority === 'Critical' ? 'bg-red-100 text-red-800' : task.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                    {task.priority}
                </span>
            </div>
          </div>
          
          {/* RIGHT SIDE: Action Button */}
          <div className="ml-6">
            <button
              onClick={() => handleMarkComplete(task.task_id)}
              disabled={task.status === 'Complete'}
              className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-150 disabled:bg-gray-400"
            >
              Mark Complete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;