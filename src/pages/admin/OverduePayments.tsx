/**
 * OverduePayments Component
 * 
 * Displays learners with unpaid payments in a data table.
 * 
 * Features:
 * - Fetches data exclusively from /api/payments/unpaid-report endpoint
 * - Displays unpaid payment records with learner information
 * - Real-time search filtering by learner name
 * - Summary cards showing total unpaid amount, number of unpaid learners, and average overdue months
 * - Action buttons for payment reminders and marking payments as paid
 * 
 * Data Structure Expected from API:
 * {
 *   "totalUnpaidAmount": number,
 *   "numberOfUnpaidLearners": number,
 *   "averageOverdueMonths": number,
 *   "unpaidPayments": [
 *     {
 *       "id": number,
 *       "montant": number,
 *       "date": string,
 *       "status": string,
 *       "apprenantId": number,
 *       "apprenantNom": string
 *     }
 *   ]
 * }
 */

import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { paiementAPI } from '../../api/apiService';
import { Search, Calendar, AlertTriangle, Clock, DollarSign, User } from 'lucide-react';
import { Column } from 'react-table';

interface OverdueLearner {
  id: number;
  nom: string;
  montant: number;
  date: string;
  status: string;
  apprenantId: number;
  apprenantNom: string;
}

interface UnpaidReportResponse {
  totalUnpaidAmount: number;
  numberOfUnpaidLearners: number;
  averageOverdueMonths: number;
  unpaidPayments: OverdueLearner[];
}

const OverduePayments: React.FC = () => {
  const [overdueLearners, setOverdueLearners] = useState<OverdueLearner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reportStats, setReportStats] = useState({
    totalUnpaidAmount: 0,
    numberOfUnpaidLearners: 0,
    averageOverdueMonths: 0
  });

  useEffect(() => {
    fetchOverduePayments();
  }, []);

  const fetchOverduePayments = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data from the unpaid report API endpoint
      const response = await paiementAPI.getUnpaidReport();
      const reportData: UnpaidReportResponse = response.data;

      // Debug logging
      console.log('API Response:', reportData);
      console.log('Unpaid payments array:', reportData.unpaidPayments);

      // Set the unpaid payments data
      setOverdueLearners(reportData.unpaidPayments || []);
      
      // Set the statistics
      setReportStats({
        totalUnpaidAmount: reportData.totalUnpaidAmount || 0,
        numberOfUnpaidLearners: reportData.numberOfUnpaidLearners || 0,
        averageOverdueMonths: reportData.averageOverdueMonths || 0
      });

    } catch (error) {
      console.error('Error fetching unpaid report:', error);
      setError('Failed to fetch unpaid payments data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOverdueLearners = overdueLearners.filter(learner =>
    learner.apprenantNom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<OverdueLearner>[] = [
    {
      Header: 'Learner',
      accessor: 'apprenantNom',
      Cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.original.apprenantNom}</div>
            <div className="text-sm text-gray-500">ID: {row.original.apprenantId}</div>
          </div>
        </div>
      )
    },
    {
      Header: 'Payment Date',
      accessor: 'date',
      Cell: ({ value }: { value: any }) => (
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {new Date(value).toLocaleDateString('en-GB')}
          </span>
        </div>
      )
    },
    {
      Header: 'Amount',
      accessor: 'montant',
      Cell: ({ value }: { value: any }) => (
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span className="font-semibold text-green-600">
            {value.toLocaleString()} DH
          </span>
        </div>
      )
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value, row }: { value: any; row: any }) => {
        // Debug logging
        console.log('Status value:', value);
        console.log('Full row data:', row.original);
        
        // Simplified display for testing
        return (
          <div className="text-sm">
            <div className="font-medium">{value || 'No Status'}</div>
            <div className="text-xs text-gray-500">Raw: {JSON.stringify(value)}</div>
          </div>
        );
      }
    },
    {
      Header: 'Actions',
      accessor: 'id',
      Cell: ({ row }: { row: any }) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              console.log('Send reminder to:', row.original.apprenantNom);
            }}
          >
            Send Reminder
          </Button>
          <Button
            size="sm"
            onClick={() => {
              console.log('Mark as paid:', row.original.apprenantNom);
            }}
          >
            Mark Paid
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Unpaid Payments</h1>
            <p className="text-gray-600">Track and manage learners with unpaid payments</p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">{error}</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Unpaid Learners</p>
              <p className="text-2xl font-bold text-red-600">{reportStats.numberOfUnpaidLearners}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Unpaid Amount</p>
              <p className="text-2xl font-bold text-orange-600">
                {reportStats.totalUnpaidAmount.toLocaleString()} DH
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Average Overdue (Months)</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reportStats.averageOverdueMonths.toFixed(1)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by learner name..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            onClick={fetchOverduePayments}
            variant="secondary"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading unpaid payments...</p>
            </div>
          </div>
        ) : filteredOverdueLearners.length > 0 ? (
          <DataTable
            data={filteredOverdueLearners}
            columns={columns}
          />
        ) : (
          <div className="flex items-center justify-center py-12">          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No unpaid payments found</p>
          </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OverduePayments;
