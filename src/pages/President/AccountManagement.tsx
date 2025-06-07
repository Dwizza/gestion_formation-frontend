// src/pages/president/AccountManagement.tsx (Enhanced with modern design and animations)
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active?: boolean;
  editable?: boolean;
}

const AccountManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const API_BASE_URL = 'http://localhost:8080';
  const [userRole, setUserRole] = useState<string>('');
  
  useEffect(() => {
    const sessionData = localStorage.getItem('tweadup_president');
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        setToken(data.token);
        setUserRole(data.user?.role || data.role || '');
        console.log('Session loaded. User role:', data.user?.role || data.role);
      } catch (err) {
        console.error('Failed to parse session data:', err);
        setError('Session data is invalid. Please log in again.');
      }
    } else {
      setError('You are not logged in. Please log in to access this page.');
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchUsers();
  }, [token, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users with filter:', filterRole);
      
      const endpoint = `${API_BASE_URL}/api/president/users${filterRole !== 'ALL' ? `?role=${filterRole}` : ''}`;
      console.log(`Fetching users from: ${endpoint}`);
      
      const response = await axios.get(
        endpoint,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Response:', response.data);
      
      const processedUsers = response.data.map((user: any) => {
        let isEditable = false;
        
        if (userRole === 'PRESIDENT') {
          isEditable = user.role === 'ADMIN' || user.role === 'TRAINER';
        }
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          editable: isEditable
        };
      });
      
      setUsers(processedUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError(`API endpoint not found (404). Please check if the API server is running and the endpoint is correct.`);
        } else if (err.response.status === 403) {
          setError(`Access forbidden (403). You may not have permission to view these users or your token has expired.`);
        } else if (err.response.status === 401) {
          setError(`Unauthorized (401). Please log in again.`);
          localStorage.removeItem('tweadup_president');
          setToken('');
        } else {
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
        }
      } else if (err.request) {
        setError(`No response from server. Please check your internet connection and try again.`);
      } else {
        setError(`Error preparing request: ${err.message}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number, targetUserRole: string) => {
    try {
      setActionInProgress(userId);
      setError(null);
      console.log(`Deleting user ID ${userId} with role ${targetUserRole}`);
      
      if (userRole !== 'PRESIDENT') {
        setError(`Permission denied: Only the president can delete user accounts.`);
        return;
      }
      
      const endpoint = `${API_BASE_URL}/api/president/${userId}`;
      
      console.log(`Sending DELETE request to: ${endpoint}`);
      
      const response = await axios({
        method: 'DELETE',
        url: endpoint,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Delete response status:', response.status);
      
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== userId)
      );
      
      setSuccessMessage(`User account deleted successfully!`);
      setDeleteConfirmation(null);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      handleApiError(err, 'Failed to delete user');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApiError = (err: any, defaultMessage: string) => {
    if (err.response) {
      if (err.response.status === 403) {
        const errorMessage = err.response.data?.message || 
                            err.response.data?.error || 
                            `Permission denied: You don't have the necessary permissions for this action.`;
        
        setError(errorMessage);
        
        console.log('Forbidden error details:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
      } else if (err.response.status === 401) {
        setError(`Authentication error: Your session has expired. Please log in again.`);
        localStorage.removeItem('tweadup_president');
        setToken('');
      } else {
        setError(`Server error: ${err.response.status} - ${err.response.data?.message || defaultMessage}`);
      }
    } else if (err.request) {
      setError(`No response from server. Please check your internet connection and try again.`);
    } else {
      setError(`Request error: ${err.message}. Please try again.`);
    }
  };

  const handleSort = (column: 'name' | 'email' | 'role') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy].toLowerCase();
      const bValue = b[sortBy].toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const SortIcon = ({ column }: { column: 'name' | 'email' | 'role' }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 mb-8 transform hover:scale-[1.01] transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Account Management
              </h1>
              <p className="text-gray-600">Manage user accounts and permissions across your platform</p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-64"
                />
              </div>
              
              {/* Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-40"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Administrators</option>
                <option value="TRAINER">Trainers</option>
              </select>
              
              {/* Refresh Button */}
              <button
                onClick={() => fetchUsers()}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-800 font-medium">{error}</p>
                {(error.includes('401') || error.includes('403') || error.includes('token')) && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('tweadup_president');
                      window.location.href = '/president/login';
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline transition-colors"
                  >
                    Return to login
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-8 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{filteredAndSortedUsers.length}</p>
                <p className="text-gray-600">Total Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedUsers.filter(u => u.role === 'ADMIN').length}
                </p>
                <p className="text-gray-600">Administrators</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedUsers.filter(u => u.role === 'TRAINER').length}
                </p>
                <p className="text-gray-600">Trainers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-spin animate-reverse"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    {[
                      { key: 'name', label: 'Name' },
                      { key: 'email', label: 'Email' },
                      { key: 'role', label: 'Role' }
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-6 py-4 text-left cursor-pointer hover:bg-blue-100 transition-colors group"
                        onClick={() => handleSort(key as 'name' | 'email' | 'role')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                            {label}
                          </span>
                          <SortIcon column={key as 'name' | 'email' | 'role'} />
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-left">
                      <span className="text-sm font-semibold text-gray-700">Status</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-sm font-semibold text-gray-700">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAndSortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <p className="text-gray-500 font-medium">No users found</p>
                          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 animate-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'ADMIN' 
                              ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' 
                              : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            user.active !== false 
                              ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800' 
                              : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                          }`}>
                            {user.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {deleteConfirmation === user.id ? (
                            <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                              <span className="text-sm text-gray-600 mr-2">Confirm delete?</span>
                              <button
                                onClick={() => deleteUser(user.id, user.role)}
                                disabled={actionInProgress === user.id}
                                className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium rounded-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-md disabled:opacity-50"
                              >
                                {actionInProgress === user.id ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Deleting...</span>
                                  </div>
                                ) : (
                                  'Yes, Delete'
                                )}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmation(null)}
                                disabled={actionInProgress === user.id}
                                className="px-3 py-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs font-medium rounded-lg hover:from-gray-500 hover:to-gray-600 transform hover:scale-105 transition-all duration-200 shadow-md disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmation(user.id)}
                              disabled={!user.editable || actionInProgress !== null}
                              className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                !user.editable 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 transform hover:scale-105 shadow-md hover:shadow-lg'
                              }`}
                              title={!user.editable ? "You don't have permission to delete this user" : "Delete this user account"}
                            >
                              <svg className={`w-4 h-4 transition-transform duration-200 ${!user.editable ? '' : 'group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
};

export default AccountManagement;