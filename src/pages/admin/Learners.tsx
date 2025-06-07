import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Edit, Trash2, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { apprenantAPI, groupeAPI } from '../../api/apiService';

interface Learner {
  id: number;
  nom: string;
  email: string;
  phone: string;
  status: string;
  joinDate: string; // Changed from date to string type
  groupes?: { id: number; name: string }[]; // Changed to array for multiple groups
  groupeIds?: number[];
  groupeNames?: string[];
}

interface Group {
  id: number;
  name: string;
}

const Learners: React.FC = () => {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentLearner, setCurrentLearner] = useState<Learner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newLearner, setNewLearner] = useState({
    nom: '',
    email: '',
    phone: '',
    status: '',
    joinDate: '',
    groupeIds: [] as number[], // Changed to array for multiple groups
  });

  const fetchLearners = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apprenantAPI.getAll();

      let learnersData: any[] = [];

      if (response?.data?._embedded) {
        const embeddedData = response.data._embedded;
        const possibleCollectionNames = [
          'apprenants', 'learners', 'apprenantList', 'learnerList',
          'apprenantEntities', 'learnerEntities', 'apprenantDtoList'
        ];

        let learnersCollection = null;
        for (const key of Object.keys(embeddedData)) {
          if (possibleCollectionNames.includes(key) || Array.isArray(embeddedData[key])) {
            learnersCollection = embeddedData[key];
            break;
          }
        }

        if (!learnersCollection) {
          const embeddedKeys = Object.keys(embeddedData);
          if (embeddedKeys.length === 1 && Array.isArray(embeddedData[embeddedKeys[0]])) {
            learnersCollection = embeddedData[embeddedKeys[0]];
          } else {
            setError('Could not identify learners data in server response');
            return;
          }
        }

        learnersData = learnersCollection;
      } else if (Array.isArray(response?.data)) {
        learnersData = response.data;
      } else if (response?.data && typeof response?.data === 'object') {
        const learnersArray =
          Array.isArray(response.data.content) ? response.data.content :
          Array.isArray(response.data.data) ? response.data.data :
          response.data.apprenants ? response.data.apprenants :
          response.data.learners ? response.data.learners : [];

        if (learnersArray.length > 0) {
          learnersData = learnersArray;
        } else if (response.data.id) {
          learnersData = [response.data];
        } else {
          setError('Could not parse learner data from server');
          return;
        }
      } else {
        setError('Unexpected data format received from server');
        return;
      }

      const processedLearners = learnersData.map((item: any) => {
        // Create a groupes array from groupeIds and groupeNames if they exist
        const groupes = item.groupeIds && item.groupeNames ? 
          item.groupeIds.map((id: number, index: number) => ({
            id: id,
            name: item.groupeNames[index] || 'Unnamed Group'
          })) : [];

        return {
          id: item.id,
          nom: item.nom || item.name || 'Unnamed',
          email: item.email || '-',
          phone: item.phone || '-',
          status: item.status || item.statut || 'Unknown',
          joinDate: item.joinDate || '-',
          groupes: groupes,
          groupeIds: item.groupeIds || [],
          groupeNames: item.groupeNames || []
        };
      });

      console.log('Processed learners:', processedLearners);
      setLearners(processedLearners);
    } catch (error: any) {
      setError('Failed to load learners from server');
      console.error('Error fetching learners:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await groupeAPI.getAll();
      let groupsData: any[] = [];

      if (response?.data?._embedded) {
        const embeddedData = response.data._embedded;
        const possibleGroupKeys = ['groupes', 'groups', 'groupList'];

        let groupCollection = null;
        for (const key of Object.keys(embeddedData)) {
          if (possibleGroupKeys.includes(key) || Array.isArray(embeddedData[key])) {
            groupCollection = embeddedData[key];
            break;
          }
        }

        if (!groupCollection) {
          const embeddedKeys = Object.keys(embeddedData);
          if (embeddedKeys.length === 1 && Array.isArray(embeddedData[embeddedKeys[0]])) {
            groupCollection = embeddedData[embeddedKeys[0]];
          }
        }

        groupsData = groupCollection || [];
      } else if (Array.isArray(response?.data)) {
        groupsData = response.data;
      } else if (response?.data && typeof response?.data === 'object') {
        const groupsArray =
          Array.isArray(response.data.content) ? response.data.content :
          Array.isArray(response.data.data) ? response.data.data :
          response.data.groupes ? response.data.groupes :
          response.data.groups ? response.data.groups : [];

        groupsData = groupsArray.length > 0 ? groupsArray :
          response.data.id ? [response.data] : [];
      }

      const processedGroups = groupsData.map((item: any) => ({
        id: item.id,
        name: item.name || item.nom || 'Unnamed Group'
      }));

      setGroups(processedGroups);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    fetchLearners();
    fetchGroups();
  }, []);

  const openCreateModal = () => {
    setNewLearner({
      nom: '', email: '', phone: '', status: '',
      joinDate: '', groupeIds: []
    });
    setCurrentLearner(null);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const openEditModal = (learner: Learner) => {
    setNewLearner({
      nom: learner.nom,
      email: learner.email,
      phone: learner.phone,
      status: learner.status,
      joinDate: learner.joinDate,
      groupeIds: learner.groupeIds || [],
    });
    setCurrentLearner(learner);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLearner.nom.trim()) {
      alert('Name is required');
      return;
    }

    try {
      // Get selected group IDs from the form
      const selectedGroups = Array.from(
        document.querySelectorAll('input[name="groupeIds"]:checked')
      ).map(el => parseInt((el as HTMLInputElement).value));

      const payload = {
        ...newLearner,
        groupeIds: selectedGroups.length > 0 ? selectedGroups : [],
      };

      console.log('Submitting payload:', payload);

      if (isEdit && currentLearner) {
        await apprenantAPI.update(currentLearner.id.toString(), payload);
      } else {
        await apprenantAPI.create(payload);
      }

      setIsModalOpen(false);
      setNewLearner({
        nom: '', email: '', phone: '', status: '',
        joinDate: '', groupeIds: []
      });
      fetchLearners();
    } catch (error: any) {
      console.error('Error saving learner:', error);
      alert('Error saving learner. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this learner?')) {
      try {
        await apprenantAPI.delete(id.toString());
        setLearners(learners.filter(l => l.id !== id));
        fetchLearners();
      } catch (error: any) {
        console.error('Error deleting learner:', error);
        alert('Error deleting learner. Please try again.');
      }
    }
  };

  const filteredLearners = learners.filter(learner =>
    learner.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCell = (value: any) =>
    value && value !== '-' ? value : <span className="text-gray-400">-</span>;

  const columns = [
    { Header: 'Name', accessor: 'nom' as keyof Learner, Cell: ({ value }: any) => formatCell(value) },
    { Header: 'Email', accessor: 'email' as keyof Learner, Cell: ({ value }: any) => formatCell(value) },
    { Header: 'Phone', accessor: 'phone' as keyof Learner, Cell: ({ value }: any) => formatCell(value) },
    {
      Header: 'Groups',
      accessor: (row: Learner) => {
        if (row.groupeNames && row.groupeNames.length > 0) {
          return row.groupeNames.join(', ');
        }
        if (row.groupes && row.groupes.length > 0) {
          return row.groupes.map(g => g.name).join(', ');
        }
        return null;
      },
      Cell: ({ value }: any) => formatCell(value),
    },
    { Header: 'Status', accessor: 'status' as keyof Learner, Cell: ({ value }: any) => formatCell(value) },
    { Header: 'Join Date', accessor: 'joinDate' as keyof Learner, Cell: ({ value }: any) => formatCell(value) },
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
        <h1 className="text-2xl font-semibold">Learners Management</h1>
        <Button onClick={openCreateModal} className="flex items-center space-x-2">
          <UserPlus size={20} />
          <span>Add Learner</span>
        </Button>
      </div>

      <div className="flex mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search learners..."
            className="form-input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

     

      <Card>
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading learners...</p>
        ) : filteredLearners.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No learners found</p>
        ) : (
          <DataTable<Learner> columns={columns} data={filteredLearners} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEdit ? 'Edit Learner' : 'Add Learner'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="learnerForm">
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="learnerForm" onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" name="nom" value={newLearner.nom} onChange={(e) => setNewLearner({ ...newLearner, nom: e.target.value })} required />
          <Input label="Email" name="email" type="email" value={newLearner.email} onChange={(e) => setNewLearner({ ...newLearner, email: e.target.value })} required />
          <Input label="Phone" name="phone" value={newLearner.phone} onChange={(e) => setNewLearner({ ...newLearner, phone: e.target.value })} required />
          <Input label="Join Date" type="date" name="joinDate" value={newLearner.joinDate} onChange={(e) => setNewLearner({ ...newLearner, joinDate: e.target.value })} required />
          <Input label="Status" name="status" value={newLearner.status} onChange={(e) => setNewLearner({ ...newLearner, status: e.target.value })} required />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Groups</label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {groups.length === 0 ? (
                <p className="text-gray-500 text-sm">No groups available</p>
              ) : (
                groups.map((group) => (
                  <div key={group.id} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      id={`group-${group.id}`}
                      name="groupeIds"
                      value={group.id}
                      className="mr-2"
                      defaultChecked={
                        (currentLearner?.groupeIds || []).includes(group.id)
                      }
                    />
                    <label htmlFor={`group-${group.id}`} className="text-sm">
                      {group.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Learners;