import React, { useEffect, useState } from 'react';
import { Users, Calendar, Loader, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { groupeAPI } from '../../api/apiService';

// Define interfaces for our data structures
interface Group {
  id: number;
  name: string;
  formationId: number;
  formationTitle: string;
  startDate: string;
  endDate: string;
  learnerCount: number;
  status: string;
}

interface UpcomingClass {
  id: number;
  groupName: string;
  trainingName: string;
  date: string;
  learnerCount: number;
}

const TrainerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch trainer's groups
        const groupsResponse = await groupeAPI.getByFormateur(user.id.toString());
        const trainerGroups = groupsResponse.data;
        setGroups(trainerGroups);
        
        // Generate upcoming classes (next 3 sessions)
        if (trainerGroups && trainerGroups.length > 0) {
          const upcoming: UpcomingClass[] = [];
          
          // Sort groups by startDate if available
          const sortedGroups = [...trainerGroups].sort((a, b) => {
            if (a.startDate && b.startDate) {
              return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            }
            return 0;
          });
          
          // Take up to 3 groups for upcoming classes
          sortedGroups.slice(0, 3).forEach((group, index) => {
            const today = new Date();
            today.setDate(today.getDate() + index);
            
            const timeOptions = index === 0 
              ? "Today" 
              : index === 1 
                ? "Tomorrow" 
                : `${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            
            upcoming.push({
              id: group.id,
              groupName: group.name,
              trainingName: group.formationTitle || 'N/A',
              date: timeOptions,
              learnerCount: group.learnerCount || 0
            });
          });
          
          setUpcomingClasses(upcoming);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Simplified stat cards - only showing groups
  const statCards = [
    {
      title: 'My Groups',
      value: groups.length.toString(),
      icon: <Users size={24} className="text-primary-600" />,
    },
    {
      title: 'Active Groups',
      value: groups.filter(g => 
        g.status?.toLowerCase() === 'active').length.toString(),
      icon: <Calendar size={24} className="text-accent-600" />,
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary-600" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-6">Welcome, {user?.name || 'Trainer'}</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}
      
      {/* Stats Cards - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-full h-fit">
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Upcoming Classes */}
        <Card title="Upcoming Classes">
          <div className="space-y-4">
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((cls) => (
                <div key={cls.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{cls.groupName}</h4>
                      <p className="text-sm text-gray-600">{cls.trainingName}</p>
                      <p className="text-xs text-gray-500 mt-1">{cls.date}</p>
                    </div>
                    <div className="flex items-center">
                      <Users size={14} className="mr-1 text-gray-500" />
                      <span className="text-sm">{cls.learnerCount}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No upcoming classes found
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Group List Summary */}
      <Card title="My Groups">
        <div className="space-y-4">
          {groups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Training Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{group.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{group.formationTitle || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{group.learnerCount || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${group.status?.toLowerCase() === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'}`}>
                          {group.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No groups found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TrainerDashboard;