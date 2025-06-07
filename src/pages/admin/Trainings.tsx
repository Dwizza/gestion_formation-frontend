import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { formationAPI } from '../../api/apiService';

// Define a proper status enum to prevent inconsistencies
export enum TrainingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Readable status labels for display
export const TrainingStatusLabels = {
  [TrainingStatus.ACTIVE]: 'Active',
  [TrainingStatus.INACTIVE]: 'Inactive',
  [TrainingStatus.UPCOMING]: 'Upcoming',
  [TrainingStatus.COMPLETED]: 'Completed',
  [TrainingStatus.CANCELLED]: 'Cancelled',
};

interface Training {
  id?: number | string;
  title: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  status: string;
  price?: number; 
  duration?: string;
  _id?: string | number;
  trainingId?: number;
  formationId?: number;
  _links?: any;
  links?: any;
  _original?: any;
}

const Trainings: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTraining, setCurrentTraining] = useState<Training | null>(null);
  const [newTraining, setNewTraining] = useState({
    title: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    status: TrainingStatus.ACTIVE,
    price: '',
    duration: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to extract ID from HATEOAS links
  const extractIdFromHref = (href: string): number | null => {
    if (!href) return null;
    
    // Try to extract ID from URLs like /api/formations/123
    const matches = href.match(/\/([^\/]+)\/(\d+)$/);
    if (matches && matches[2]) {
      return parseInt(matches[2], 10);
    }
    return null;
  };

  // Improved function to generate a unique ID if one doesn't exist
  const generateUniqueId = (): string => {
    return 'temp-' + Math.random().toString(36).substring(2, 9);
  };

  // Helper function to normalize status values
  const normalizeStatus = (status: string | null | undefined): TrainingStatus => {
    if (!status) return TrainingStatus.INACTIVE;
    
    const normalizedStatus = status.toLowerCase().trim();
    
    // Map various possible status values to our enum
    if (normalizedStatus === 'active' || normalizedStatus === 'activated' || normalizedStatus === 'open') {
      return TrainingStatus.ACTIVE;
    } else if (normalizedStatus === 'inactive' || normalizedStatus === 'deactivated' || normalizedStatus === 'closed') {
      return TrainingStatus.INACTIVE;
    } else if (normalizedStatus === 'upcoming' || normalizedStatus === 'planned' || normalizedStatus === 'scheduled') {
      return TrainingStatus.UPCOMING;
    } else if (normalizedStatus === 'completed' || normalizedStatus === 'finished' || normalizedStatus === 'done') {
      return TrainingStatus.COMPLETED;
    } else if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled' || normalizedStatus === 'aborted') {
      return TrainingStatus.CANCELLED;
    }
    
    // Default to inactive for unknown status values
    return TrainingStatus.INACTIVE;
  };

  // Helper function to normalize training objects with better ID handling
  const normalizeTraining = (training: any, index: number): Training => {
    // Check if training is null or undefined first
    if (!training) {
      console.error('Received null/undefined training object');
      return {
        id: `temp-null-${index}`, // Generate temporary ID
        title: 'Unknown',
        description: '',
        dateDebut: '',
        dateFin: '',
        status: TrainingStatus.INACTIVE
      };
    }
    
    // Try to extract the ID from different possible field names
    let id = training.id ?? training._id ?? training.formationId ?? training.trainingId;
    
    // Try to extract from links if no direct ID is found
    if (id === undefined || id === null) {
      if (training._links && training._links.self && training._links.self.href) {
        id = extractIdFromHref(training._links.self.href);
      } else if (training.links && training.links.self && training.links.self.href) {
        id = extractIdFromHref(training.links.self.href);
      }
    }
    
    // Generate a temporary ID if we still don't have one
    if (id === undefined || id === null) {
      // Use index to ensure uniqueness within this dataset
      id = `temp-${index}-${generateUniqueId()}`;
      console.warn(`Generated temporary ID for training: ${id}`);
    }
    
    // Normalize the status field to use our enum values
    const normalizedStatus = normalizeStatus(training.status);
    
    return {
      id: id,
      title: training.title || '',
      description: training.description || '',
      dateDebut: training.dateDebut || training.startDate || '',
      dateFin: training.dateFin || training.endDate || '',
      status: normalizedStatus,
      price: training.price || null,
      duration: training.duration || '',
      // Store original data for debugging
      _original: training
    };
  };

  const fetchTrainings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await formationAPI.getAll();

      console.log('API Response:', response);

      let extractedTrainings: any[] = [];

      // Handle Spring Boot HATEOAS response format
      if (response.data && response.data._embedded) {
        const embeddedData = response.data._embedded;
        console.log('_embedded data:', embeddedData);

        // Find the trainings collection by looking for common collection names
        const possibleCollectionNames = [
          'trainings', 'formations', 'trainingList', 'formationList',
          'trainingEntities', 'formationEntities', 'formationDtoList'
        ];

        let trainingsCollection = null;
        for (const key of Object.keys(embeddedData)) {
          console.log(`Found collection key: ${key}`);
          if (possibleCollectionNames.includes(key) ||
            Array.isArray(embeddedData[key])) {
            trainingsCollection = embeddedData[key];
            break;
          }
        }

        if (trainingsCollection) {
          extractedTrainings = trainingsCollection;
        } else {
          // If no specific collection was found, but there's only one key
          // in _embedded, use that as the collection
          const embeddedKeys = Object.keys(embeddedData);
          if (embeddedKeys.length === 1 && Array.isArray(embeddedData[embeddedKeys[0]])) {
            extractedTrainings = embeddedData[embeddedKeys[0]];
          } else {
            console.error('Could not identify trainings collection in _embedded:', embeddedData);
            setError('Could not identify trainings data in server response');
          }
        }
      } else if (Array.isArray(response.data)) {
        extractedTrainings = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Handle other object formats
        console.log('Data is an object with keys:', Object.keys(response.data));

        // Try common API response structures
        extractedTrainings =
          Array.isArray(response.data.content) ? response.data.content :
          Array.isArray(response.data.data) ? response.data.data :
          response.data.trainings ? response.data.trainings :
          response.data.formations ? response.data.formations : [];

        if (extractedTrainings.length === 0 && response.data.id) {
          // The response might be a single training object
          extractedTrainings = [response.data];
        }
      }

      // Now normalize all training objects to ensure they have consistent fields
      if (extractedTrainings.length > 0) {
        const normalizedTrainings = extractedTrainings.map((training, index) => 
          normalizeTraining(training, index)
        );
        
        // Debug the normalized trainings
        console.log('Normalized trainings:', normalizedTrainings);
        
        // Check if any trainings have temporary IDs
        const tempIds = normalizedTrainings.filter(t => String(t.id).startsWith('temp-'));
        if (tempIds.length > 0) {
          console.warn(`${tempIds.length} trainings have temporary IDs:`, tempIds);
        }
        
        setTrainings(normalizedTrainings);
      } else {
        setTrainings([]);
        if (!error) {
          setError('No training data found in server response');
        }
      }
    } catch (error) {
      console.error('Failed to fetch trainings:', error);
      setTrainings([]);
      setError('Failed to load trainings from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const openCreateModal = () => {
    setNewTraining({ 
      title: '', 
      description: '', 
      dateDebut: '', 
      dateFin: '', 
      status: TrainingStatus.ACTIVE,
      price: '',
      duration: ''
    });
    setCurrentTraining(null);
    setIsModalOpen(true);
  };

  const openEditModal = (training: Training) => {
    console.log('Opening edit modal with training:', training);
    
    // Check if training has a temporary ID
    const idStr = String(training.id || '');
    const isTemporaryId = idStr.startsWith('temp-');
    
    if (isTemporaryId) {
      alert('This training does not have a real ID from the server. It cannot be edited. Please reload the page or contact the administrator.');
      return;
    }
    
    setNewTraining({
      title: training.title || '',
      description: training.description || '',
      dateDebut: training.dateDebut || '',
      dateFin: training.dateFin || '',
      status: normalizeStatus(training.status),
      price: training.price?.toString() || '',
      duration: training.duration || '',
    });
    
    setCurrentTraining(training);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!newTraining.title.trim()) {
      alert('Title is required');
      return;
    }

    try {
      console.log('Submitting training form...');
      
      // Convert price string to number if it's not empty
      const formattedTraining = {
        ...newTraining,
        price: newTraining.price ? parseFloat(newTraining.price) : null
      };

      if (currentTraining && currentTraining.id) {
        // Check if the ID is temporary
        const idStr = String(currentTraining.id);
        if (idStr.startsWith('temp-')) {
          alert('Cannot update a training with a temporary ID. Please reload the page or contact the administrator.');
          return;
        }
        
        console.log(`Updating training with ID: ${currentTraining.id}`);
        
        // Always convert ID to string for API calls
        const idString = String(currentTraining.id);
        
        // Include the ID in the payload for update
        const trainingWithId = {
          ...formattedTraining,
          id: currentTraining.id
        };
        
        try {
          console.log('Update payload:', trainingWithId);
          const response = await formationAPI.update(idString, trainingWithId);
          console.log('Update response:', response);
          
          // Success message
          alert('Training updated successfully!');
        } catch (updateError) {
          console.error('Error during update operation:', updateError);
          
          // Try alternative update approach
          try {
            console.log('Trying alternative update approach...');
            // Some APIs require a different format or endpoint
            const response = await formationAPI.update(`formation/${idString}`, trainingWithId);
            console.log('Alternative update response:', response);
            alert('Training updated successfully with alternative method!');
          } catch (altError) {
            console.error('Alternative update also failed:', altError);
            alert('Error updating training. Please check console for details.');
            return;
          }
        }
      } else {
        // No current training or no ID, so perform a create
        console.log('Creating new training...');
        console.log('Create payload:', formattedTraining);
        
        const response = await formationAPI.create(formattedTraining);
        console.log('Create response:', response);
        
        // Success message
        alert('New training created successfully!');
      }

      setIsModalOpen(false);

      // Clear form
      setNewTraining({ 
        title: '', 
        description: '', 
        dateDebut: '', 
        dateFin: '', 
        status: TrainingStatus.ACTIVE,
        price: '',
        duration: '' 
      });

      // Reload trainings with a slight delay to ensure server has processed the changes
      setTimeout(() => fetchTrainings(), 500);
    } catch (error) {
      console.error('Error saving training:', error);
      alert('Error saving training. Please check console for details.');
    }
  };

  const handleDelete = async (id: number | string | undefined) => {
    if (id === undefined || id === null) {
      alert('Cannot delete this training as it does not have a valid ID.');
      return;
    }
    
    // Check if the ID is temporary
    const idStr = String(id);
    if (idStr.startsWith('temp-')) {
      alert('Cannot delete a training with a temporary ID. Please reload the page or contact the administrator.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this training?')) {
      try {
        console.log(`Attempting to delete training with ID: ${id}`);
        
        // Convert ID to string for API call
        const idString = String(id);
        
        // Try to delete by ID directly
        try {
          await formationAPI.delete(idString);
          console.log(`Successfully deleted training with ID: ${idString}`);
        } catch (deleteError) {
          console.error(`Error with direct delete: ${deleteError}`);
          
          // If direct delete fails, try alternative endpoint format
          try {
            console.log(`Trying alternative delete endpoint...`);
            await formationAPI.delete(`formation/${idString}`);
            console.log(`Successfully deleted with alternative endpoint`);
          } catch (altError) {
            // Both approaches failed, throw error
            throw new Error(`Both delete approaches failed: ${altError}`);
          }
        }

        // Update local state immediately for better UX
        setTrainings(prevTrainings => prevTrainings.filter(t => {
          // Compare using string equivalence to avoid type mismatches
          return String(t.id) !== idString && 
                 String(t._id) !== idString && 
                 String(t.formationId) !== idString && 
                 String(t.trainingId) !== idString;
        }));
        
        // Then fetch fresh data from server
        setTimeout(() => fetchTrainings(), 500);
        
        // Success message
        alert('Training deleted successfully.');
      } catch (error) {
        console.error('Error deleting training:', error);
        alert('Error deleting training. Please check the console for details.');
      }
    }
  };

  // Get status badge style based on status value
  const getStatusBadgeClass = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    
    switch (normalizedStatus) {
      case TrainingStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case TrainingStatus.INACTIVE:
        return 'bg-red-100 text-red-800';
      case TrainingStatus.UPCOMING:
        return 'bg-blue-100 text-blue-800';
      case TrainingStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800';
      case TrainingStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to get readable status label
  const getStatusLabel = (status: string): string => {
    const normalizedStatus = normalizeStatus(status);
    return TrainingStatusLabels[normalizedStatus] || 'Unknown';
  };

  // Make sure trainings is an array before filtering
  const filteredTrainings = Array.isArray(trainings)
    ? trainings.filter(training =>
      (training.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
    : [];

  const columns = [
    {
      Header: 'Title',
      accessor: 'title' as keyof Training,
      Cell: ({ value, row }: any) => value || 'Untitled'
    },
    {
      Header: 'Description',
      accessor: 'description' as keyof Training,
      Cell: ({ value }: any) => value || '-'
    },
    {
      Header: 'Start Date',
      accessor: 'dateDebut' as keyof Training,
      Cell: ({ value }: any) => value || '-'
    },
    {
      Header: 'End Date',
      accessor: 'dateFin' as keyof Training,
      Cell: ({ value }: any) => value || '-'
    },
    {
      Header: 'Status',
      accessor: 'status' as keyof Training,
      Cell: ({ value }: any) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(value)}`}>
          {getStatusLabel(value)}
        </span>
      )
    },
    {
      Header: 'Price',
      accessor: 'price' as keyof Training,
      Cell: ({ value }: any) => value ? `${value}` : '-'
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }: any) => {
        const training = row.original;
        const id = training.id;
        
        // Check if this is a temporary ID
        const idStr = String(id || '');
        const isTemporaryId = idStr.startsWith('temp-');
        
        // Define click handlers directly in the render function
        const handleEditClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (isTemporaryId) {
            alert("This training cannot be edited because it has no server-generated ID");
          } else {
            openEditModal(training);
          }
        };
        
        const handleDeleteClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (isTemporaryId) {
            alert("This training cannot be deleted because it has no server-generated ID");
          } else {
            handleDelete(id);
          }
        };
        
        return (
          <div className="flex space-x-2">
            <button 
              className={`btn btn-sm ${!isTemporaryId ? 'btn-outline btn-info' : 'btn-disabled'}`}
              onClick={handleEditClick}
              type="button"
              title={!isTemporaryId ? "Edit this training" : "This training has no server ID and cannot be edited"}
            >
              <Edit size={16} />
            </button>
            <button 
              className={`btn btn-sm ${!isTemporaryId ? 'btn-outline btn-error' : 'btn-disabled'}`}
              onClick={handleDeleteClick}
              type="button"
              title={!isTemporaryId ? "Delete this training" : "This training has no server ID and cannot be deleted"}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Training Courses</h1>
        <Button onClick={openCreateModal} className="flex items-center space-x-2">
          <Plus size={16} />
          <span>Add Training</span>
        </Button>
      </div>

      <div className="flex mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search training..."
            className="form-input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Warning display for temporary IDs */}
      {trainings.some(t => String(t.id || '').startsWith('temp-')) && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Warning: Incomplete Training Data</p>
          <p>Some training entries don't have proper IDs from the server. These entries cannot be edited or deleted until this issue is resolved.</p>
          <p>Contact your administrator or check the server API configuration.</p>
        </div>
      )}

      <Card>
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading trainings...</p>
        ) : filteredTrainings.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No trainings found</p>
        ) : (
          <DataTable<Training> columns={columns} data={filteredTrainings} />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentTraining ? 'Edit Training' : 'Add Training'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="trainingForm">
              {currentTraining ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="trainingForm" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={newTraining.title}
            onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
            required
          />
          <Input
            label="Description"
            name="description"
            value={newTraining.description}
            onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
            required
          />
          <Input
            label="Start Date"
            type="date"
            name="dateDebut"
            value={newTraining.dateDebut}
            onChange={(e) => setNewTraining({ ...newTraining, dateDebut: e.target.value })}
            required
          />
          <Input
            label="End Date"
            type="date"
            name="dateFin"
            value={newTraining.dateFin}
            onChange={(e) => setNewTraining({ ...newTraining, dateFin: e.target.value })}
            required
          />
          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              name="status"
              value={newTraining.status}
              onChange={(e) => setNewTraining({ ...newTraining, status: e.target.value })}
              className="select select-bordered w-full"
              required
            >
              <option value={TrainingStatus.ACTIVE}>{TrainingStatusLabels[TrainingStatus.ACTIVE]}</option>
              <option value={TrainingStatus.INACTIVE}>{TrainingStatusLabels[TrainingStatus.INACTIVE]}</option>
              <option value={TrainingStatus.UPCOMING}>{TrainingStatusLabels[TrainingStatus.UPCOMING]}</option>
              <option value={TrainingStatus.COMPLETED}>{TrainingStatusLabels[TrainingStatus.COMPLETED]}</option>
              <option value={TrainingStatus.CANCELLED}>{TrainingStatusLabels[TrainingStatus.CANCELLED]}</option>
            </select>
          </div>
          <Input
            label="Price"
            type="number"
            name="price"
            value={newTraining.price}
            onChange={(e) => setNewTraining({ ...newTraining, price: e.target.value })}
            placeholder="Enter price"
          />
          
        </form>
      </Modal>
    </div>
  );
};

export default Trainings;