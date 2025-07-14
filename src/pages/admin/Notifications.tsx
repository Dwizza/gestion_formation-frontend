import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import NotificationItem from '../../components/notifications/NotificationItem';
import { markNotificationAsRead } from '../../api/apiService';
import { useNotifications } from '../../hooks/useNotifications';
import { Bell, AlertTriangle, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

// Helper function to check if a notification is read
// Handles both boolean (true/false) and number (1/0) formats
const isNotificationRead = (luValue: boolean | number): boolean => {
  if (typeof luValue === 'boolean') {
    return luValue; // true = read, false = unread
  }
  return luValue === 1; // 1 = read, 0 = unread
};

const Notifications: React.FC = () => {
  // Using the custom hook for notifications
  const {
    notifications,
    loading,
    error,
    stats,
    loadAllNotifications,
    filterByTypeLocally,
    filterUrgentLocally,
    clearFilters,
    markAsReadLocally
  } = useNotifications();

  // States for filters
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'type'>('all');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReadNotifications, setShowReadNotifications] = useState(false); // New state to show/hide read notifications

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed at 10 items per page

  // Load notifications on startup
  useEffect(() => {
    loadAllNotifications();
  }, []);

  // Function to handle filter changes (using local filtering now)
  const handleFilterChange = (filterType: 'all' | 'urgent' | 'type', value?: string) => {
    setSelectedFilter(filterType);
    
    if (filterType === 'all') {
      clearFilters();
      setSelectedType('');
    } else if (filterType === 'urgent') {
      filterUrgentLocally(true);
      setSelectedType('');
    } else if (filterType === 'type' && value) {
      filterByTypeLocally(value);
      setSelectedType(value);
    }
  };

  // Function to mark a notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      // 1. Mark as read on the server side
      await markNotificationAsRead(id);
      
      // 2. Update the local state immediately
      markAsReadLocally(id);
      
      // Note: The notification marked as read will automatically disappear 
      // from the list if showReadNotifications is false
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // In case of an error, reload all notifications to restore the correct state
      loadAllNotifications();
    }
  };

  // Filter notifications based on search term and read status
  const filteredNotifications = notifications
    .filter(notification => {
      // Filter by read status: by default, only show unread notifications
      if (!showReadNotifications && isNotificationRead(notification.lu)) {
        return false; // Hide read notifications if the option is not enabled
      }
      return true;
    })
    .filter(notification =>
      notification.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Pagination logic
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter, selectedType, showReadNotifications]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold mb-6">Notifications</h1>
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading notifications...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and statistics */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </h1>
        <div className="flex items-center gap-4">
          {/* Button to show/hide read notifications */}
          <Button
            variant={showReadNotifications ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowReadNotifications(!showReadNotifications)}
          >
            {showReadNotifications ? 'Hide Read' : 'Show Read'}
          </Button>
          
          {/* Statistics */}
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{stats.total}</div>
              <div className="text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">{stats.unread}</div>
              <div className="text-gray-500">Unread</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-600">{stats.urgent}</div>
              <div className="text-gray-500">Urgent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and search */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search bar */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or message..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={selectedFilter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleFilterChange('all')}
            >
              <Filter className="h-4 w-4 mr-1" />
              All
            </Button>
            <Button
              variant={selectedFilter === 'urgent' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleFilterChange('urgent')}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Urgent
            </Button>
          </div>

          {/* Type selector */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedFilter === 'type' ? selectedType : ''}
            onChange={(e) => {
              if (e.target.value) {
                handleFilterChange('type', e.target.value);
              } else {
                handleFilterChange('all');
              }
            }}
          >
            <option value="">All Types</option>
            <option value="PAYMENT">Payment</option>
            <option value="ATTENDANCE">Attendance</option>
          </select>

          {/* Reload button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={loadAllNotifications}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Error display */}
      {error && (
        <Card>
          <div className="text-red-600 text-center py-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            {error}
          </div>
        </Card>
      )}

      {/* List of notifications */}
      <div className="space-y-4">
        {/* Indication of the number of results */}
        {notifications.length > 0 && (
          <div className="flex justify-between items-center text-sm text-gray-600 px-1">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
              {!showReadNotifications && ' (unread only)'}
            </span>
            {!showReadNotifications && stats.unread === 0 && stats.total > 0 && (
              <span className="text-green-600 font-medium">
                ✅ All notifications are read!
              </span>
            )}
          </div>
        )}
        
        {filteredNotifications.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
              {searchTerm ? (
                <div>
                  <p className="text-lg font-medium mb-2">No notifications found</p>
                  <p>No results for "{searchTerm}"</p>
                </div>
              ) : !showReadNotifications && stats.unread === 0 && stats.total > 0 ? (
                <div>
                  <p className="text-lg font-medium mb-2 text-green-600">All notifications are read!</p>
                  <p>Click on "Show Read" to see all notifications</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">No notifications available</p>
                  <p>New notifications will appear here</p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Notifications list */}
            {paginatedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Card>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    {/* Results info */}
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex space-x-1">
                        {getPageNumbers().map((page, index) => (
                          <div key={index}>
                            {page === '...' ? (
                              <span className="px-3 py-1 text-gray-500">...</span>
                            ) : (
                              <Button
                                size="sm"
                                variant={currentPage === page ? "primary" : "secondary"}
                                onClick={() => goToPage(page as number)}
                              >
                                {page}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;