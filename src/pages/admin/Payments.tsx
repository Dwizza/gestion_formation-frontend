import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { paiementAPI, apprenantAPI } from '../../api/apiService';
import { api } from '../../contexts/AuthContext';
import axios from 'axios';
import { Search, Plus, Edit, Trash2, Filter, Calendar, AlertCircle } from 'lucide-react';

interface Payment {
  id: number;
  montant: number;
  date: string;
  statut: string;
  apprenantId: number;
  apprenantNom: string;
  moisPaye?: number; // Number of months paid
}

interface Learner {
  id: number;
  nom: string;
  email: string;
  dateInscription?: string; // Date when the learner enrolled
  moisPaies?: number; // Total months paid
  formationDuration?: number; // Duration of formation in months
}

const MAX_FORMATION_DURATION = 6; // Maximum formation duration in months

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [learnerPaymentSummary, setLearnerPaymentSummary] = useState<Record<number, { totalPaid: number, remainingMonths: number }>>({}); 
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [newPayment, setNewPayment] = useState({
    montant: '',
    date: new Date().toISOString().split('T')[0],
    statut: 'PENDING',
    apprenantId: '',
    moisPaye: '1' // Default to 1 month payment
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching payments from API...');
      console.log('🌐 Making request to: /api/paiements');
      
      const response = await paiementAPI.getAll();
      console.log('📥 Raw API response:', response);
      console.log('📊 Response data:', response.data);
      console.log('📋 Response status:', response.status);
      
      if (Array.isArray(response.data)) {
        setPayments(response.data);
        console.log('✅ Payments loaded successfully:', response.data.length, 'payments');
      } else {
        console.error('❌ Unexpected payment data format:', response.data);
        setPayments([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch payments - Full error:', error);
      
      if (error.response) {
        console.error('📡 Error response status:', error.response.status);
        console.error('📡 Error response data:', error.response.data);
        console.error('📡 Error response headers:', error.response.headers);
        console.error('📡 Request URL was:', error.config?.url);
        console.error('📡 Request method was:', error.config?.method);
        console.error('📡 Request headers were:', error.config?.headers);
      } else if (error.request) {
        console.error('📡 No response received:', error.request);
      } else {
        console.error('📡 Error message:', error.message);
      }
      
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLearners = async () => {
    try {
      const response = await apprenantAPI.getAll();
      if (Array.isArray(response.data)) {
        setLearners(response.data);
      } else {
        console.error('Unexpected learner data format:', response.data);
        setLearners([]);
      }
    } catch (error) {
      console.error('Failed to fetch learners:', error);
      setLearners([]);
    }
  };

  // Calculate how many months each learner has paid for
  const calculatePaymentSummary = () => {
    const summary: Record<number, { totalPaid: number, remainingMonths: number }> = {};
    
    // Initialize all learners with 0 paid months
    learners.forEach(learner => {
      summary[learner.id] = { totalPaid: 0, remainingMonths: MAX_FORMATION_DURATION };
    });
    
    // Calculate paid months from payment records
    payments.forEach(payment => {
      if (payment.statut === 'PAID' && payment.apprenantId && summary[payment.apprenantId]) {
        // Get months paid from this payment record (default to 1 if not specified)
        const monthsPaid = payment.moisPaye || 1;
        summary[payment.apprenantId].totalPaid += monthsPaid;
        
        // Calculate remaining months (cap at 0)
        const remaining = MAX_FORMATION_DURATION - summary[payment.apprenantId].totalPaid;
        summary[payment.apprenantId].remainingMonths = remaining > 0 ? remaining : 0;
      }
    });
    
    setLearnerPaymentSummary(summary);
  };

  // Check if today is the first day of the month and update payment statuses if needed
  const checkAndUpdateMonthlyPayments = async () => {
    const today = new Date();
    if (today.getDate() === 1) { // First day of the month
      try {
        // First, check if we've already created entries for this month to avoid duplicates
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const existingPayments = payments.filter(p => p.date === currentMonthStart);
        
        // If we don't have entries for all learners for this month
        if (existingPayments.length < learners.length) {
          console.log('Creating new monthly payments for learners...');
          
          // Create new UNPAID payment records for each learner
          for (const learner of learners) {
            // Check if this learner already has a payment for this month
            const hasPaymentThisMonth = existingPayments.some(
              p => p.apprenantId === learner.id && p.date === currentMonthStart
            );
            
            if (!hasPaymentThisMonth) {
              const newMonthlyPayment = {
                montant: 0,
                date: currentMonthStart,
                statut: 'UNPAID',
                apprenantId: learner.id,
                moisPaye: 1 // Default to 1 month payment
              };
              
              await paiementAPI.create(newMonthlyPayment);
            }
          }
          
          // Refresh payments after creating new ones
          await fetchPayments();
        }
      } catch (error) {
        console.error('Error creating monthly payments:', error);
      }
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchLearners();
  }, []);

  // Effect to calculate payment summary whenever payments or learners change
  useEffect(() => {
    if (learners.length > 0 && payments.length > 0) {
      calculatePaymentSummary();
      checkAndUpdateMonthlyPayments();
    }
    
    // Optional: Set up a daily check to handle the first day of month
    const dailyCheck = setInterval(() => {
      checkAndUpdateMonthlyPayments();
    }, 24 * 60 * 60 * 1000); // Check once every 24 hours
    
    return () => clearInterval(dailyCheck);
  }, [learners, payments]);

  const filteredPayments = Array.isArray(payments)
    ? payments.filter(p => {
        // Filter by learner name
        const matchesSearch = (p.apprenantNom?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        
        // Filter by status if a status filter is selected
        const matchesStatus = !statusFilter || p.statut === statusFilter;
        
        // Filter by date if a date filter is selected
        const matchesDate = !dateFilter || p.date === dateFilter;
        
        return matchesSearch && matchesStatus && matchesDate;
      })
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPayment({
      ...newPayment,
      [name]: value
    });
  };

  const openCreateModal = () => {
    setNewPayment({
      montant: '',
      date: new Date().toISOString().split('T')[0],
      statut: 'PENDING',
      apprenantId: '',
      moisPaye: '1'
    });
    setCurrentPayment(null);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const openEditModal = (payment: Payment) => {
    setNewPayment({
      montant: payment.montant.toString(),
      date: payment.date,
      statut: payment.statut,
      apprenantId: payment.apprenantId?.toString() || '',
      moisPaye: (payment.moisPaye || 1).toString()
    });
    setCurrentPayment(payment);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.montant || !newPayment.apprenantId) {
      alert('Amount and Learner are required');
      return;
    }

    try {
      const payload = {
        montant: parseInt(newPayment.montant),
        date: newPayment.date,
        statut: newPayment.statut,
        apprenantId: parseInt(newPayment.apprenantId),
        moisPaye: parseInt(newPayment.moisPaye)
      };
      
      if (isEdit && currentPayment) {
        await paiementAPI.update(currentPayment.id.toString(), payload);
      } else {
        await paiementAPI.create(payload);
      }

      setIsModalOpen(false);
      fetchPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error saving payment. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await api.delete(`/paiements/${id}`);
        
        // Update UI by removing the deleted payment
        setPayments(payments.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Error deleting payment. Please try again.');
      }
    }
  };

  // Generate monthly payments manually (for testing or if the automated process fails)
  const generateMonthlyPayments = async () => {
    if (window.confirm('Generate UNPAID payments for all learners for the current month?')) {
      try {
        const currentMonthStart = new Date(
          new Date().getFullYear(), 
          new Date().getMonth(), 
          1
        ).toISOString().split('T')[0];
        
        for (const learner of learners) {
          // Check if this learner already has a payment for this month
          const hasPaymentThisMonth = payments.some(
            p => p.apprenantId === learner.id && p.date === currentMonthStart
          );
          
          if (!hasPaymentThisMonth) {
            const newMonthlyPayment = {
              montant: 0,
              date: currentMonthStart,
              statut: 'UNPAID',
              apprenantId: learner.id,
              moisPaye: 1 // Default to 1 month payment
            };
            
            await paiementAPI.create(newMonthlyPayment);
          }
        }
        
        alert('Monthly payments generated successfully');
        fetchPayments();
      } catch (error) {
        console.error('Error generating monthly payments:', error);
        alert('Error generating monthly payments');
      }
    }
  };

  // Test API connectivity with detailed debugging
  const testAPIConnection = async () => {
    console.log('🧪 Testing API connections...');
    
    // Test the base URL
    console.log('🌐 Current API base URL:', api.defaults.baseURL);
    
    try {
      console.log('Testing payments API directly with axios...');
      const paymentsTest = await api.get('/paiements');
      console.log('✅ Payments API works:', paymentsTest);
    } catch (error: any) {
      console.error('❌ Payments API failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        fullURL: error.config?.baseURL + error.config?.url
      });
      
      // Try without the extra /api
      try {
        console.log('🔄 Trying alternative endpoint: /paiements');
        const altTest = await axios.get('http://localhost:8080/api/paiements', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': api.defaults.headers.common.Authorization
          }
        });
        console.log('✅ Alternative endpoint works:', altTest);
      } catch (altError: any) {
        console.error('❌ Alternative endpoint also failed:', altError.response?.status);
      }
    }
    
    try {
      console.log('Testing learners API...');
      const learnersTest = await api.get('/apprenants');
      console.log('✅ Learners API works:', learnersTest);
    } catch (error: any) {
      console.error('❌ Learners API failed:', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
  };

  const columns = [
    { Header: 'Amount', accessor: 'montant' as keyof Payment },
    { Header: 'Date', accessor: 'date' as keyof Payment },
    { 
      Header: 'Months Paid',
      accessor: 'moisPaye' as keyof Payment,
      Cell: ({ value }: any) => value || 1,
    },
    { 
      Header: 'Status', 
      accessor: 'statut' as keyof Payment,
      Cell: ({ value }: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'PAID' ? 'bg-green-100 text-green-800' : 
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      Header: 'Learner',
      accessor: 'apprenantNom' as keyof Payment,
      Cell: ({ value }: any) => value || 'Unknown',
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

  const summaryColumns = [
    {
      Header: 'Learner Name',
      accessor: 'nom' as keyof Learner,
    },
    {
      Header: 'Months Paid',
      accessor: 'id' as keyof Learner,
      Cell: ({ value }: any) => {
        const summary = learnerPaymentSummary[value];
        return summary ? summary.totalPaid : 0;
      }
    },
    {
      Header: 'Remaining Months',
      accessor: 'id' as keyof Learner,
      Cell: ({ row }: any) => {
        const learnerId = row.original.id;
        const summary = learnerPaymentSummary[learnerId];
        const remaining = summary ? summary.remainingMonths : MAX_FORMATION_DURATION;
        
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            remaining === 0 ? 'bg-blue-100 text-blue-800' : 
            remaining <= 1 ? 'bg-red-100 text-red-800' : 
            remaining <= 2 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-green-100 text-green-800'
          }`}>
            {remaining}
          </span>
        );
      }
    },
    {
      Header: 'Progress',
      accessor: 'id' as keyof Learner,
      Cell: ({ row }: any) => {
        const learnerId = row.original.id;
        const summary = learnerPaymentSummary[learnerId];
        const totalPaid = summary ? summary.totalPaid : 0;
        const progressPercent = Math.min((totalPaid / MAX_FORMATION_DURATION) * 100, 100);
        
        return (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        );
      }
    },
    {
      Header: 'Status',
      accessor: 'id' as keyof Learner,
      Cell: ({ row }: any) => {
        const learnerId = row.original.id;
        const summary = learnerPaymentSummary[learnerId];
        const totalPaid = summary ? summary.totalPaid : 0;
        
        if (totalPaid >= MAX_FORMATION_DURATION) {
          return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">Completed</span>;
        } else if (totalPaid === 0) {
          return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Not Started</span>;
        } else {
          return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">In Progress</span>;
        }
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <div className="flex space-x-2">
         
          <Button 
            variant="secondary" 
            onClick={generateMonthlyPayments}
            className="flex items-center space-x-2"
          >
            <Calendar size={20} />
            <span>Generate Monthly</span>
          </Button>
          <Button onClick={openCreateModal} className="flex items-center space-x-2">
            <Plus size={20} />
            <span>Add Payment</span>
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Formation maximum duration is <span className="font-bold">{MAX_FORMATION_DURATION} months</span>. 
              Click the "Payment Summary" button to view how many months each learner has paid.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search learner..."
            className="form-input pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button 
          variant="secondary" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2"
        >
          <Filter size={18} />
          <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
        </Button>

        <Button 
          variant={showPaymentSummary ? "primary" : "secondary"}
          onClick={() => setShowPaymentSummary(!showPaymentSummary)}
          className="flex items-center space-x-2"
        >
          <Calendar size={18} />
          <span>{showPaymentSummary ? "Hide Payment Summary" : "Payment Summary"}</span>
        </Button>
        
        {showFilters && (
          <Button 
            variant="secondary" 
            onClick={clearFilters}
            className="text-sm text-gray-500"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              id="dateFilter"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      )}

      {showPaymentSummary ? (
        <Card>
          <h2 className="text-xl font-semibold mb-4 p-4 border-b">Payment Summary (Max Duration: {MAX_FORMATION_DURATION} months)</h2>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading payment summary...</p>
          ) : learners.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No learners found</p>  
          ) : (
            <DataTable<Learner> columns={summaryColumns} data={learners} />
          )}
        </Card>
      ) : (
        <Card>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading payments...</p>
          ) : filteredPayments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No payments found</p>  
          ) : (
            <DataTable<Payment> columns={columns} data={filteredPayments} />
          )}
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEdit ? 'Edit Payment' : 'Add Payment'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="paymentForm">
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="paymentForm" onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Amount" 
            name="montant" 
            type="number" 
            value={newPayment.montant} 
            onChange={handleInputChange} 
            required 
          />
          
          <Input 
            label="Date" 
            name="date" 
            type="date" 
            value={newPayment.date} 
            onChange={handleInputChange} 
            required 
          />
          
          <div>
            <label htmlFor="moisPaye" className="block text-sm font-medium text-gray-700 mb-1">Months Paid</label>
            <select
              id="moisPaye"
              name="moisPaye"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={newPayment.moisPaye}
              onChange={handleInputChange}
              required
            >
              {[1, 2, 3, 4, 5, 6].map(month => (
                <option key={month} value={month}>{month} {month === 1 ? 'month' : 'months'}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="statut"
              name="statut"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={newPayment.statut}
              onChange={handleInputChange}
              required
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="apprenantId" className="block text-sm font-medium text-gray-700 mb-1">Learner</label>
            <select
              id="apprenantId"
              name="apprenantId"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={newPayment.apprenantId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a learner</option>
              {learners.map((learner) => {
                const summary = learnerPaymentSummary[learner.id];
                const totalPaid = summary ? summary.totalPaid : 0;
                
                return (
                  <option key={learner.id} value={learner.id}>
                    {learner.nom} ({totalPaid}/{MAX_FORMATION_DURATION} months paid)
                  </option>
                );
              })}
            </select>
          </div>
          
          {newPayment.apprenantId && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="font-medium text-sm text-gray-700">Payment Status:</h4>
              {(() => {
                if (!newPayment.apprenantId) return null;
                const learnerId = parseInt(newPayment.apprenantId);
                const summary = learnerPaymentSummary[learnerId];
                const totalPaid = summary ? summary.totalPaid : 0;
                const moisPayeValue = parseInt(newPayment.moisPaye || '1');
                const wouldPay = totalPaid + (newPayment.statut === 'PAID' ? moisPayeValue : 0);
                
                return (
                  <div className="mt-1 text-sm">
                    <p>Current months paid: <span className="font-medium">{totalPaid}/{MAX_FORMATION_DURATION}</span></p>
                    {newPayment.statut === 'PAID' && (
                      <p className="mt-1">
                        After this payment: <span className="font-medium">{wouldPay}/{MAX_FORMATION_DURATION}</span>
                        {wouldPay >= MAX_FORMATION_DURATION && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Formation Complete
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Payments;