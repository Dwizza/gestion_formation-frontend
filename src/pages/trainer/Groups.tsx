import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import { Column } from 'react-table';
import { groupeAPI } from '../../api/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { Loader } from 'lucide-react';

// Define interface for group data based on your API
interface Group {
  id: number;
  name: string;
  status: string;
  capaciteMax: number;
  startDate: string;
  endDate: string;
  formation: {
    id: number;
    title: string;
  };
  learnerCount: number;
}

const TrainerGroups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          const response = await groupeAPI.getByFormateur(user.id.toString());
          setGroups(response.data);
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to load groups. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  // Correctly type the columns for react-table with specific accessors
  const columns = React.useMemo<Column<Group>[]>(
    () => [
      {
        Header: 'Group Name',
        accessor: 'name',
      },
      
      {
        Header: 'Schedule',
        accessor: (row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
      },
      {
        Header: 'Students',
        accessor: (row) => row.learnerCount || row.apprenants?.length || 0,
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }: { value: string }) => (
          <span 
            className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${value?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 
                value?.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'}
            `}
          >
            {value || 'Unknown'}
          </span>
        ),
      },
    ],
    []
  );

  // Helper function to format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary-600" />
        <span className="ml-2">Loading groups...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Groups</h1>
      
      <Card>
        {groups.length > 0 ? (
          <DataTable<Group>
            columns={columns}
            data={groups}
            initialPageSize={10}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No groups assigned to you yet.
          </div>
        )}
      </Card>
    </div>
  );
};

export default TrainerGroups;