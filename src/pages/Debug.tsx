// src/pages/Debug.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationStatusDebug from '../components/debug/NotificationStatusDebug';

const Debug: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('Debug page loaded');
    console.log('LocalStorage:', localStorage.getItem('tweadup_user'));
    console.log('Auth state:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('All storage cleared');
    window.location.reload();
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-bold">Authentication State:</h2>
        <pre>{JSON.stringify({ isAuthenticated, user }, null, 2)}</pre>
      </div>

      {/* Toast Notification Debug Section */}
      <div className="mb-6">
        <NotificationStatusDebug />
      </div>
      
      <div className="flex flex-col space-y-2">
        <button 
          onClick={clearStorage}
          className="bg-red-500 text-white py-2 px-4 rounded"
        >
          Clear All Storage
        </button>
        
        <button 
          onClick={logout}
          className="bg-orange-500 text-white py-2 px-4 rounded"
        >
          Logout
        </button>
        
        <Link 
          to="/login"
          className="bg-blue-500 text-white py-2 px-4 rounded text-center"
        >
          Go to Login
        </Link>
        
        <Link 
          to="/admin"
          className="bg-green-500 text-white py-2 px-4 rounded text-center"
        >
          Go to Admin
        </Link>
        
        <Link 
          to="/trainer"
          className="bg-purple-500 text-white py-2 px-4 rounded text-center"
        >
          Go to Trainer
        </Link>
      </div>
    </div>
  );
};

export default Debug;