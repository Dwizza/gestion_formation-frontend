import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { groupeAPI, formationAPI, formateurAPI } from '../../api/apiService';

// Define types with optional properties to handle nullable values
interface Formation {
  id: number;
  title: string;
}

interface Trainer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface Group {
  id?: number;
  name: string;
  capaciteMax: number;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  learnerCount: number;
  formation?: Formation | null;
  formationId?: number | null;
  trainerId?: number | null;
  trainerName?: string | null;
  _links: {
    self?: { href: string };
    formation?: { href: string };
    apprenants?: { href: string };
    trainer?: { href: string };
  };
}

// Form state interface for better type checking
interface GroupFormState {
  name: string;
  capaciteMax: string;
  formationId: string;
  trainerId: string;
  status: string;
  startDate: string;
  endDate: string;
}

// Safe number parser that handles undefined/null values
const safeParseInt = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return isNaN(parsed) ? null : parsed;
};

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [trainings, setTrainings] = useState<Formation[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [newGroup, setNewGroup] = useState<GroupFormState>({
    name: '',
    capaciteMax: '',
    formationId: '',
    trainerId: '',
    status: 'active', // Default status
    startDate: '',
    endDate: '',
  });

  // Safely extracts an ID from a URL or string
  const extractIdFromUrl = (url: string | undefined): number | null => {
    if (!url) return null;

    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const parsed = parseInt(lastPart, 10);

    return isNaN(parsed) ? null : parsed;
  };

  // Fetch trainers with robust error handling
  const fetchTrainers = async (): Promise<Trainer[]> => {
    try {
      const response = await formateurAPI.getAll();
      console.log('Raw trainer API response:', response);

      let trainersData: any[] = [];

      // Handle various response formats
      if (response?.data?._embedded) {
        const embeddedData = response.data._embedded;
        const embeddedKeys = Object.keys(embeddedData);

        for (const key of embeddedKeys) {
          if (Array.isArray(embeddedData[key])) {
            trainersData = embeddedData[key];
            break;
          }
        }
      } else if (Array.isArray(response?.data)) {
        trainersData = response.data;
      } else if (response?.data) {
        trainersData = [response.data];
      }

      console.log('Extracted trainers data:', trainersData);

      // Process trainers with proper type safety
      const processedTrainers: Trainer[] = [];

      for (const item of trainersData) {
        let id: number | null = null;

        // Try to extract ID from various sources
        if (item.id !== undefined) {
          id = safeParseInt(item.id);
        } else if (item._links?.self?.href) {
          id = extractIdFromUrl(item._links.self.href);
        }

        // Only add items with valid IDs
        if (id !== null) {
          const name = item.name || item.nom || item.fullName || 'Unnamed Trainer';
          processedTrainers.push({ 
            id, 
            name,
            email: item.email || null,
            phone: item.phone || null
          });
          console.log(`Processed trainer: id=${id}, name=${name}`);
        } else {
          console.log('Skipped trainer with invalid ID:', item);
        }
      }

      console.log('Final processed trainers:', processedTrainers);
      setTrainers(processedTrainers);
      return processedTrainers;
    } catch (error) {
      console.error('Failed to fetch trainers:', error);
      setTrainers([]);
      return [];
    }
  };

  // Fetch trainings with robust error handling
  const fetchTrainings = async (): Promise<Formation[]> => {
    try {
      const response = await formationAPI.getAll();
      console.log('Raw training API response:', response);

      let trainingsData: any[] = [];

      // Handle various response formats
      if (response?.data?._embedded) {
        const embeddedData = response.data._embedded;
        const embeddedKeys = Object.keys(embeddedData);

        for (const key of embeddedKeys) {
          if (Array.isArray(embeddedData[key])) {
            trainingsData = embeddedData[key];
            break;
          }
        }
      } else if (Array.isArray(response?.data)) {
        trainingsData = response.data;
      } else if (response?.data) {
        trainingsData = [response.data];
      }

      console.log('Extracted trainings data:', trainingsData);

      // Process trainings with proper type safety
      const processedTrainings: Formation[] = [];

      for (const item of trainingsData) {
        let id: number | null = null;

        // Try to extract ID from various sources
        if (item.id !== undefined) {
          id = safeParseInt(item.id);
        } else if (item._links?.self?.href) {
          id = extractIdFromUrl(item._links.self.href);
        }

        // Only add items with valid IDs
        if (id !== null) {
          const title = item.title || item.name || 'Unnamed Training';
          processedTrainings.push({ id, title });
          console.log(`Processed training: id=${id}, title=${title}`);
        } else {
          console.log('Skipped training with invalid ID:', item);
        }
      }

      console.log('Final processed trainings:', processedTrainings);
      setTrainings(processedTrainings);
      return processedTrainings;
    } catch (error) {
      console.error('Failed to fetch trainings:', error);
      setTrainings([]);
      return [];
    }
  };

  // Find a formation by ID with proper null handling
  const findFormationById = (id: number | null | undefined, trainingsList: Formation[]): Formation | null => {
    if (id === null || id === undefined || trainingsList.length === 0) {
      return null;
    }

    return trainingsList.find(t => t.id === id) || null;
  };

  // Find a trainer by ID with proper null handling
  const findTrainerById = (id: number | null | undefined, trainersList: Trainer[]): Trainer | null => {
    if (id === null || id === undefined || trainersList.length === 0) {
      return null;
    }

    return trainersList.find(t => t.id === id) || null;
  };

  // Extract formation ID from a group object with multiple fallbacks
  const extractFormationId = (group: any): number | null => {
    // Method 1: Direct formationId property
    if (group.formationId !== undefined) {
      const id = safeParseInt(group.formationId);
      if (id !== null) {
        console.log(`Found formationId directly: ${id}`);
        return id;
      }
    }

    // Method 2: From formation object
    if (group.formation?.id !== undefined) {
      const id = safeParseInt(group.formation.id);
      if (id !== null) {
        console.log(`Found formationId from formation object: ${id}`);
        return id;
      }
    }

    // Method 3: From formation link
    if (group._links?.formation?.href) {
      const id = extractIdFromUrl(group._links.formation.href);
      if (id !== null) {
        console.log(`Found formationId from formation link: ${id}`);
        return id;
      }
    }

    // If we couldn't find an ID, return null
    console.log(`Could not extract formationId from group:`, group);
    return null;
  };

  // Extract trainer ID from a group object with multiple fallbacks
  const extractTrainerId = (group: any): number | null => {
    // Method 1: Direct trainerId property
    if (group.trainerId !== undefined) {
      const id = safeParseInt(group.trainerId);
      if (id !== null) {
        console.log(`Found trainerId directly: ${id}`);
        return id;
      }
    }

    // Method 2: From trainer object
    if (group.trainer?.id !== undefined) {
      const id = safeParseInt(group.trainer.id);
      if (id !== null) {
        console.log(`Found trainerId from trainer object: ${id}`);
        return id;
      }
    }

    // Method 3: From trainer link
    if (group._links?.trainer?.href) {
      const id = extractIdFromUrl(group._links.trainer.href);
      if (id !== null) {
        console.log(`Found trainerId from trainer link: ${id}`);
        return id;
      }
    }

    // If we couldn't find an ID, return null
    console.log(`Could not extract trainerId from group:`, group);
    return null;
  };

  // Get status badge style based on status value
  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch groups with robust error and type handling
  const fetchGroups = async () => {
    setLoading(true);
    try {
      // Fetch trainings and trainers first to use for lookup
      const trainingsList = await fetchTrainings();
      const trainersList = await fetchTrainers();
      console.log(`Fetched ${trainingsList.length} trainings and ${trainersList.length} trainers for lookup`);

      const response = await groupeAPI.getAll();
      console.log('Group API response:', response);

      let groupsData: any[] = [];

      // Handle various response formats
      if (response?.data?._embedded?.groupes) {
        groupsData = response.data._embedded.groupes;
      } else if (response?.data?._embedded) {
        const embeddedData = response.data._embedded;
        const firstKey = Object.keys(embeddedData)[0];
        if (Array.isArray(embeddedData[firstKey])) {
          groupsData = embeddedData[firstKey];
        }
      } else if (Array.isArray(response?.data)) {
        groupsData = response.data;
      } else if (response?.data) {
        groupsData = [response.data];
      }

      console.log('Extracted groups data:', groupsData);

      // Process each group with proper error handling
      const processedGroups: Group[] = [];

      for (const groupData of groupsData) {
        try {
          // Extract ID with fallback
          const id = groupData.id !== undefined
            ? safeParseInt(groupData.id)
            : extractIdFromUrl(groupData._links?.self?.href);

          // Get formation ID
          const formationId = extractFormationId(groupData);

          // Get trainer ID
          const trainerId = extractTrainerId(groupData);

          // Find matching formation
          let formation: Formation | null = null;
          if (formationId !== null) {
            const matchedTraining = findFormationById(formationId, trainingsList);
            if (matchedTraining) {
              formation = {
                id: matchedTraining.id,
                title: matchedTraining.title
              };
            }
          } else if (groupData.formation && groupData.formation.id && groupData.formation.title) {
            formation = {
              id: safeParseInt(groupData.formation.id) || 0,
              title: groupData.formation.title
            };
          }

          // Create processed group with safe defaults
          const processedGroup: Group = {
            id: id || undefined,
            name: groupData.name || 'Unnamed Group',
            capaciteMax: safeParseInt(groupData.capaciteMax) || 0,
            startDate: groupData.startDate || null,
            endDate: groupData.endDate || null,
            status: groupData.status || 'active', // Default to active if no status
            learnerCount: safeParseInt(groupData.learnerCount) || 0,
            formation: formation,
            formationId: formationId,
            trainerId: trainerId,
            trainerName: groupData.trainerName || null,
            _links: groupData._links || {}
          };

          console.log(`Processed group ${id}:`, {
            id,
            name: processedGroup.name,
            formationId,
            trainerId,
            status: processedGroup.status
          });

          processedGroups.push(processedGroup);
        } catch (error) {
          console.error("Error processing group:", error, groupData);
        }
      }

      console.log(`Successfully processed ${processedGroups.length} groups`);
      setGroups(processedGroups);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openCreateModal = () => {
    setNewGroup({
      name: '',
      capaciteMax: '',
      formationId: '',
      trainerId: '',
      status: 'active',
      startDate: '',
      endDate: ''
    });
    setCurrentGroup(null);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    let formationIdStr = '';
    let trainerIdStr = '';

    // Try multiple sources to find formationId
    if (group.formationId !== undefined && group.formationId !== null) {
      formationIdStr = group.formationId.toString();
    } else if (group.formation?.id) {
      formationIdStr = group.formation.id.toString();
    }

    // Try multiple sources to find trainerId
    if (group.trainerId !== undefined && group.trainerId !== null) {
      trainerIdStr = group.trainerId.toString();
    }

    console.log(`Opening edit modal for group ${group.id} with formationId: ${formationIdStr} and trainerId: ${trainerIdStr}`);

    setNewGroup({
      name: group.name || '',
      capaciteMax: (group.capaciteMax || 0).toString(),
      formationId: formationIdStr,
      trainerId: trainerIdStr,
      status: group.status || 'active',
      startDate: group.startDate || '',
      endDate: group.endDate || ''
    });

    setCurrentGroup(group);
    setIsEdit(true);
    setIsModalOpen(true);

    // Debug log after state update
    setTimeout(() => {
      console.log('Form state after openEditModal:', newGroup);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && (!currentGroup || currentGroup.id === undefined)) {
      console.error('Cannot update: currentGroup or id is missing');
      return;
    }

    // Parse formationId with proper error handling
    const formationId = newGroup.formationId ? safeParseInt(newGroup.formationId) : null;
    const capaciteMax = safeParseInt(newGroup.capaciteMax) || 0;
    const trainerId = newGroup.trainerId ? safeParseInt(newGroup.trainerId) : null;

    console.log('Submitting form with data:', {
      name: newGroup.name,
      capaciteMax,
      formationId,
      trainerId,
      status: newGroup.status,
      startDate: newGroup.startDate,
      endDate: newGroup.endDate
    });

    const groupData = {
      name: newGroup.name,
      capaciteMax,
      formationId,
      trainerId,
      status: newGroup.status,
      startDate: newGroup.startDate || null,
      endDate: newGroup.endDate || null
    };

    try {
      if (isEdit && currentGroup?.id !== undefined) {
        console.log(`Updating group ${currentGroup.id}:`, groupData);
        await groupeAPI.update(currentGroup.id.toString(), groupData);
      } else {
        console.log('Creating new group:', groupData);
        await groupeAPI.create(groupData);
      }

      setIsModalOpen(false);
      fetchGroups(); // Refresh the data
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Failed to save group. Please try again.');
    }
  };

  const handleDelete = async (id?: number) => {
    if (id === undefined) {
      console.error('Cannot delete: id is undefined');
      return;
    }

    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await groupeAPI.delete(id.toString());
        fetchGroups(); // Refresh the data
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group. Please try again.');
      }
    }
  };

  const filteredGroups = groups.filter(group =>
    (group.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      Header: 'Group Name',
      accessor: (row: Group) => row.name || 'N/A',
    },
    {
      Header: 'Capacity',
      accessor: (row: Group) => row.capaciteMax || 0,
    },
    {
      Header: 'Formation',
      accessor: (row: Group) => {
        // Try multiple sources to find formation title
        if (row.formation?.title) {
          return row.formation.title;
        }

        if (row.formationId !== undefined && row.formationId !== null) {
          const formation = trainings.find(t => t.id === row.formationId);
          if (formation) {
            return formation.title;
          }
          return `ID: ${row.formationId}`;
        }

        return 'N/A';
      },
    },
    {
      Header: 'Trainer',
      accessor: (row: Group) => {
        // Try multiple sources to find trainer name
        if (row.trainerName) {
          return row.trainerName;
        }

        if (row.trainerId !== undefined && row.trainerId !== null) {
          const trainer = trainers.find(t => t.id === row.trainerId);
          if (trainer) {
            return trainer.name;
          }
          return `ID: ${row.trainerId}`;
        }

        return 'Not assigned';
      },
    },
    {
      Header: 'Status',
      accessor: (row: Group) => row.status || 'N/A',
      Cell: ({ value }: { value: string | null }) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(value)}`}>
          {value || 'Unknown'}
        </span>
      ),
    },
    {
      Header: 'Start Date',
      accessor: (row: Group) => row.startDate || 'N/A',
    },
    {
      Header: 'End Date',
      accessor: (row: Group) => row.endDate || 'N/A',
    },
    {
      Header: 'Learners',
      accessor: (row: Group) => row.learnerCount || 0,
    },
    {
      Header: 'Actions',
      Cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="secondary" onClick={() => openEditModal(row.original)}>
            <Edit size={16} />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.original.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Groups</h1>
        <Button onClick={openCreateModal} className="flex items-center space-x-1">
          <Plus size={16} />
          <span>Add Group</span>
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by group name..."
              className="form-input pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading groups...</p>
        ) : groups.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No groups found</p>
        ) : (
          <DataTable<Group> columns={columns} data={filteredGroups} />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEdit ? 'Edit Group' : 'Add Group'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="groupForm">
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="groupForm" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            name="name"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            required
          />
          <Input
            label="Capacity"
            name="capaciteMax"
            type="number"
            value={newGroup.capaciteMax}
            onChange={(e) => setNewGroup({ ...newGroup, capaciteMax: e.target.value })}
            required
          />
          <div>
            <label htmlFor="formationId" className="form-label">Formation</label>
            <select
              id="formationId"
              name="formationId"
              className="form-input"
              value={newGroup.formationId}
              onChange={(e) => setNewGroup({ ...newGroup, formationId: e.target.value })}
              required
            >
              <option value="">Select Formation</option>
              {trainings.length > 0 ? (
                trainings.map((training) => (
                  <option key={training.id} value={training.id}>
                    {training.title}
                  </option>
                ))
              ) : (
                <option value="" disabled>No formations available</option>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="trainerId" className="form-label">Trainer</label>
            <select
              id="trainerId"
              name="trainerId"
              className="form-input"
              value={newGroup.trainerId}
              onChange={(e) => setNewGroup({ ...newGroup, trainerId: e.target.value })}
            >
              <option value="">Select Trainer (Optional)</option>
              {trainers.length > 0 ? (
                trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No trainers available</option>
              )}
            </select>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              name="status"
              value={newGroup.status}
              onChange={(e) => setNewGroup({ ...newGroup, status: e.target.value })}
              className="select select-bordered w-full form-input"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <Input
            label="Start Date"
            type="date"
            name="startDate"
            value={newGroup.startDate}
            onChange={(e) => setNewGroup({ ...newGroup, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            name="endDate"
            value={newGroup.endDate}
            onChange={(e) => setNewGroup({ ...newGroup, endDate: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Groups;