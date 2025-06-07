import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, Layers, AlertTriangle, DollarSign, Clock, Calendar, TrendingUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import { apprenantAPI, presenceAPI, paiementAPI, formationAPI, groupeAPI } from '../../api/apiService';
import { useAuth } from '../../contexts/AuthContext';

// Define types for our dashboard data
interface AdminStats {
  totalLearners: number;
  activeTrainings: number;
  activeGroups: number;
  unpaidPayments: number;
  attendanceRate: number;
  monthlyStats: {
    month: string;
    present: number;
    absent: number;
  }[];
  paymentStatus: {
    name: string;
    value: number;
  }[];
  recentActivity: {
    type: string;
    title: string;
    description: string;
    time: string;
    icon: string;
  }[];
  upcomingSessions: {
    id: number;
    groupName: string;
    trainingTitle: string;
    date: string;
  }[];
}

// Colors for charts
const COLORS = {
  present: '#4CAF50',
  absent: '#F44336',
  paid: '#4CAF50',
  unpaid: '#F44336',
  pending: '#FFC107',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#10B981'
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalLearners: 0,
    activeTrainings: 0,
    activeGroups: 0,
    unpaidPayments: 0,
    attendanceRate: 0,
    monthlyStats: [],
    paymentStatus: [
      { name: 'Paid', value: 0 },
      { name: 'Unpaid', value: 0 },
      { name: 'Pending', value: 0 },
    ],
    recentActivity: [],
    upcomingSessions: []
  });

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        let learnersResponse, trainingsResponse, groupsResponse, paymentsResponse, attendanceResponse;
        
        try {
          learnersResponse = await apprenantAPI.getAll();
          learnersResponse.data = Array.isArray(learnersResponse.data) ? learnersResponse.data : [];
        } catch (err) {
          console.error('Error fetching learners:', err);
          learnersResponse = { data: [] };
        }
        
        try {
          trainingsResponse = await formationAPI.getAll();
          trainingsResponse.data = Array.isArray(trainingsResponse.data) ? trainingsResponse.data : [];
        } catch (err) {
          console.error('Error fetching trainings:', err);
          trainingsResponse = { data: [] };
        }
        
        try {
          groupsResponse = await groupeAPI.getAll();
          groupsResponse.data = Array.isArray(groupsResponse.data) ? groupsResponse.data : [];
        } catch (err) {
          console.error('Error fetching groups:', err);
          groupsResponse = { data: [] };
        }
        
        try {
          paymentsResponse = await paiementAPI.getAll();
          paymentsResponse.data = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [];
          
          // Try to get non-paid payments specifically
          try {
            const nonPaidRes = await paiementAPI.getNonPayes();
            paymentsResponse.nonPayes = Array.isArray(nonPaidRes.data) ? nonPaidRes.data : [];
          } catch (err) {
            // If the specific endpoint fails, calculate it manually
            console.log('Non-payes endpoint not available, calculating manually');
            paymentsResponse.nonPayes = paymentsResponse.data.filter((p) => 
              p.statut === 'UNPAID' || !p.datePaiement
            );
          }
        } catch (err) {
          console.error('Error fetching payments:', err);
          paymentsResponse = { data: [], nonPayes: [] };
        }
        
        try {
          attendanceResponse = await presenceAPI.getSummary();
          if (!attendanceResponse.data) {
            attendanceResponse.data = { present: 0, absent: 0, total: 0, presentRate: 0 };
          }
        } catch (err) {
          console.error('Error fetching attendance summary:', err);
          attendanceResponse = { 
            data: { 
              present: 0, 
              absent: 0, 
              totalRecords: 0, 
              presentRate: 0 
            } 
          };
        }

        // Calculate payment statistics - Enhanced to handle more variations in data
        const totalPayments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data.length : 0;
        
        // Debug the payment data first
        console.log('Analyzing payment data:', paymentsResponse.data.slice(0, 5));
        
        // Count payments by status - Made more robust to handle variations in data structure
        const paidCount = Array.isArray(paymentsResponse.data) ? 
          paymentsResponse.data.filter((p) => {
            if (!p) return false;
            // Check for PAID status in any case or if datePaiement exists (assuming a payment with date is paid)
            const status = p.statut ? p.statut.toString().toUpperCase() : '';
            return status === 'PAID' || 
                  (p.datePaiement && p.datePaiement !== null && p.datePaiement !== '');
          }).length : 0;
          
        const pendingCount = Array.isArray(paymentsResponse.data) ? 
          paymentsResponse.data.filter((p) => {
            if (!p) return false;
            const status = p.statut ? p.statut.toString().toUpperCase() : '';
            return status === 'PENDING';
          }).length : 0;
          
        const unpaidCount = Array.isArray(paymentsResponse.data) ? 
          paymentsResponse.data.filter((p) => {
            if (!p) return false;
            const status = p.statut ? p.statut.toString().toUpperCase() : '';
            return status === 'UNPAID' || 
                  (!p.datePaiement || p.datePaiement === null || p.datePaiement === '') && 
                  status !== 'PAID' && status !== 'PENDING';
          }).length : 0;

        // Ensure we're not losing any payments in our count
        const unclassifiedCount = totalPayments - unpaidCount - pendingCount - paidCount;
        
        console.log('Payment statistics:', {
          total: totalPayments,
          paid: paidCount,
          unpaid: unpaidCount,
          pending: pendingCount,
          unclassified: unclassifiedCount
        });

        // Calculate attendance rate - Updated to match Attendance component
        let attendanceRate = 0;
        if (attendanceResponse.data) {
          if (typeof attendanceResponse.data.presentRate === 'number') {
            attendanceRate = attendanceResponse.data.presentRate;
          } else if (attendanceResponse.data.present > 0 && 
                    (attendanceResponse.data.totalRecords > 0 || attendanceResponse.data.total > 0)) {
            const total = attendanceResponse.data.totalRecords || attendanceResponse.data.total || 0;
            attendanceRate = (attendanceResponse.data.present / total) * 100;
          }
        }

        // Format attendance data for the chart - Use the same format as Attendance.tsx
        const last6Months = getLast6Months();
        const attendanceData = await fetchAttendanceData(last6Months);

        // Get upcoming sessions (next 7 days)
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        // Fixed to handle missing fields better
        const upcomingSessions = Array.isArray(groupsResponse.data) ? 
          groupsResponse.data
            .filter((group) => group && group.startDate && new Date(group.startDate) <= nextWeek)
            .map((group) => ({
              id: group.id || 0,
              groupName: group.name || 'Unknown Group',
              trainingTitle: group.formation?.title || 'Unknown Training',
              date: group.startDate || new Date().toISOString()
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          : [];

        // Get recent activities
        const recentActivities = await fetchRecentActivities(
          Array.isArray(learnersResponse.data) ? learnersResponse.data : [],
          Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [],
          Array.isArray(groupsResponse.data) ? groupsResponse.data : [],
          attendanceResponse.data || {}
        );

        // Debug training data to see what we're getting
        console.log('Training data first 5 items:', trainingsResponse.data.slice(0, 5));
        
        // Enhanced active trainings count - Handle more status variations
        const activeTrainings = Array.isArray(trainingsResponse.data) ? 
          trainingsResponse.data.filter((t) => {
            if (!t) return false;
            // Check status in a case-insensitive way and consider active if status is missing
            const status = t.status ? t.status.toString().toUpperCase() : '';
            return status === 'ACTIVE' || status === 'ONGOING' || status === 'EN_COURS' || 
                  (!status && t.dateDebut && new Date(t.dateDebut) <= new Date() && 
                  (!t.dateFin || new Date(t.dateFin) >= new Date()));
          }).length : 0;
            
        // Enhanced active groups count - Handle more status variations    
        const activeGroups = Array.isArray(groupsResponse.data) ? 
          groupsResponse.data.filter((g) => {
            if (!g) return false;
            // Check status in a case-insensitive way and consider active if it has start date but no end date or future end date
            const status = g.status ? g.status.toString().toUpperCase() : '';
            return status === 'ACTIVE' || status === 'ONGOING' || status === 'EN_COURS' || 
                  (!status && g.startDate && new Date(g.startDate) <= new Date() && 
                  (!g.endDate || new Date(g.endDate) >= new Date()));
          }).length : 0;
        
        // Debug output to verify counts
        console.log('Active trainings count:', activeTrainings, 'out of', trainingsResponse.data.length);
        console.log('Active groups count:', activeGroups, 'out of', groupsResponse.data.length);

        setStats({
          totalLearners: Array.isArray(learnersResponse.data) ? learnersResponse.data.length : 0,
          activeTrainings,
          activeGroups,
          unpaidPayments: unpaidCount,
          attendanceRate,
          monthlyStats: attendanceData,
          paymentStatus: [
            { name: 'Paid', value: paidCount },
            { name: 'Unpaid', value: unpaidCount },
            { name: 'Pending', value: pendingCount },
          ],
          recentActivity: recentActivities,
          upcomingSessions: upcomingSessions.slice(0, 3) // Only show 3 upcoming
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to generate last 6 months for chart
  const getLast6Months = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        name: monthNames[month.getMonth()],
        year: month.getFullYear(),
        month: month.getMonth() + 1
      });
    }
    
    return months;
  };

  // Fetch attendance data for the chart - Updated to match the Attendance component's approach
  const fetchAttendanceData = async (months) => {
    try {
      const attendanceData = [];
      
      for (const monthObj of months) {
        try {
          const monthStr = `${monthObj.year}-${String(monthObj.month).padStart(2, '0')}-01`;
          
          let presenceData = [];
          try {
            // Try to fetch filtered data from the API
            const response = await presenceAPI.filter(monthStr);
            presenceData = Array.isArray(response.data) ? response.data : [];
          } catch (err) {
            console.log(`Failed to filter by date ${monthStr}, fetching all presences`);
            
            // If filter endpoint fails, get all and filter manually - consistent with Attendance.tsx
            const allResponse = await presenceAPI.getAll();
            
            // Handle both direct array and paginated response structures as in Attendance.tsx
            if (Array.isArray(allResponse.data)) {
              presenceData = allResponse.data;
            } else if (allResponse.data && allResponse.data._embedded && 
                      Array.isArray(allResponse.data._embedded.presences)) {
              presenceData = allResponse.data._embedded.presences;
            } else {
              console.warn('Expected array or _embedded.presences in attendance data');
              presenceData = [];
            }
            
            // Filter by month manually
            presenceData = presenceData.filter((p) => {
              if (!p || !p.date) return false;
              const presenceDate = new Date(p.date);
              return presenceDate.getMonth() + 1 === monthObj.month && 
                    presenceDate.getFullYear() === monthObj.year;
            });
          }
          
          // Count present/absent exactly as in Attendance.tsx component
          const presentCount = presenceData.filter(
            (p) => p && (p.statut === 'PRESENT' || p.statut === 'present')
          ).length;
          
          const absentCount = presenceData.filter(
            (p) => p && (p.statut === 'ABSENT' || p.statut === 'absent')
          ).length;
          
          attendanceData.push({
            month: monthObj.name,
            present: presentCount,
            absent: absentCount
          });
        } catch (err) {
          console.error(`Error fetching attendance for ${monthObj.name}:`, err);
          attendanceData.push({
            month: monthObj.name,
            present: 0,
            absent: 0
          });
        }
      }
      
      return attendanceData;
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      return months.map(month => ({
        month: month.name,
        present: 0,
        absent: 0
      }));
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async (
    learners,
    payments,
    groups,
    attendance
  ) => {
    try {
      // Ensure all inputs are arrays and each item has required properties before sorting
      const sortedLearners = Array.isArray(learners) ? 
        [...learners]
          .filter(a => a)
          .sort((a, b) => 
            new Date(b.createdAt || b.dateInscription || Date.now()).getTime() - 
            new Date(a.createdAt || a.dateInscription || Date.now()).getTime()
          ) : [];
      
      const sortedPayments = Array.isArray(payments) ? 
        [...payments]
          .filter(p => p)
          .sort((a, b) => 
            new Date(b.datePaiement || Date.now()).getTime() - 
            new Date(a.datePaiement || Date.now()).getTime()
          ) : [];
      
      const sortedGroups = Array.isArray(groups) ? 
        [...groups]
          .filter(g => g)
          .sort((a, b) => 
            new Date(b.createdAt || b.startDate || Date.now()).getTime() - 
            new Date(a.createdAt || a.startDate || Date.now()).getTime()
          ) : [];
      
      const sortedAttendance = attendance?.data && Array.isArray(attendance.data) ? 
        [...attendance.data]
          .filter(a => a)
          .sort((a, b) => 
            new Date(b.date || Date.now()).getTime() - 
            new Date(a.date || Date.now()).getTime()
          ) : [];

      // Combine and sort all activities
      const allActivities = [
        ...sortedLearners.slice(0, 3).map((learner) => ({
          type: 'learner',
          title: 'New learner registered',
          description: `${learner.nom || 'Student'} joined the platform`,
          time: formatTimeAgo(learner.createdAt || learner.dateInscription || Date.now()),
          icon: 'Users'
        })),
        ...sortedPayments.slice(0, 3).map((payment) => ({
          type: 'payment',
          title: 'Payment received',
          description: `Payment of ${payment.montant || '0'}$ from ${payment.apprenant?.nom || 'student'}`,
          time: formatTimeAgo(payment.datePaiement || Date.now()),
          icon: 'DollarSign'
        })),
        ...sortedGroups.slice(0, 2).map((group) => ({
          type: 'group',
          title: 'New group created',
          description: `${group.name || 'Group'} for ${group.formation?.title || 'training'}`,
          time: formatTimeAgo(group.createdAt || group.startDate || Date.now()),
          icon: 'Layers'
        })),
        ...sortedAttendance.slice(0, 2).map((attendance) => ({
          type: 'attendance',
          title: 'Attendance marked',
          description: `Attendance recorded for ${attendance.groupe?.name || 'group'}`,
          time: formatTimeAgo(attendance.date || Date.now()),
          icon: 'Clock'
        }))
      ].sort((a, b) => getTimeValue(b.time) - getTimeValue(a.time))
       .slice(0, 5); // Only show 5 most recent

      return allActivities;
    } catch (err) {
      console.error('Error fetching recent activities:', err);
      return [];
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 5) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString();
    } catch (err) {
      return 'Recently';
    }
  };

  // Helper function to convert time ago string to value for sorting
  const getTimeValue = (timeAgo) => {
    if (timeAgo === 'Just now') return 0;
    if (timeAgo.includes('minutes')) return Number(timeAgo.split(' ')[0]);
    if (timeAgo.includes('hours')) return Number(timeAgo.split(' ')[0]) * 60;
    if (timeAgo === 'Yesterday') return 24 * 60;
    if (timeAgo.includes('days')) return Number(timeAgo.split(' ')[0]) * 24 * 60;
    return 10000; // For older dates
  };

  // Prepare stat cards data
  const statCards = [
    {
      title: 'Total Learners',
      value: stats.totalLearners,
      icon: <Users size={24} className="text-blue-500" />,
      change: '+12% from last month',
      positive: true,
    },
    /*{
      title: 'Active Trainings',
      value: stats.activeTrainings,
      icon: <BookOpen size={24} className="text-purple-500" />,
      change: '+2 from last month',
      positive: true,
    },*/
    {
      title: 'Active Groups',
      value: stats.activeGroups,
      icon: <Layers size={24} className="text-green-500" />,
      change: 'Same as last month',
      positive: true,
    },
    {
      title: 'Unpaid Payments',
      value: stats.unpaidPayments,
      icon: <AlertTriangle size={24} className="text-red-500" />,
      change: '-5 from last month',
      positive: false,
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate.toFixed(1)}%`,
      icon: <TrendingUp size={24} className="text-yellow-500" />,
      change: '+3% from last month',
      positive: stats.attendanceRate > 75,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                <p className={`text-xs mt-2 ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </p>
              </div>
              <div className="p-2 rounded-full bg-opacity-20" style={{ backgroundColor: stat.positive ? '#EFF6FF' : '#FEE2E2' }}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2" title="Monthly Attendance">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.monthlyStats}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill={COLORS.present} name="Present" />
                <Bar dataKey="absent" fill={COLORS.absent} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Payment Status */}
        <Card title="Payment Status">
          <div className="h-80 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={stats.paymentStatus.filter(entry => entry.value > 0)} // Only show segments with values
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.paymentStatus.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name === 'Paid' ? COLORS.paid : 
                        entry.name === 'Unpaid' ? COLORS.unpaid : 
                        COLORS.pending
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.paid }}></div>
                <span className="text-sm">Paid ({stats.paymentStatus[0].value})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.unpaid }}></div>
                <span className="text-sm">Unpaid ({stats.paymentStatus[1].value})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.pending }}></div>
                <span className="text-sm">Pending ({stats.paymentStatus[2].value})</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <Card title="Upcoming Sessions">
          <div className="space-y-4">
            {stats.upcomingSessions.length > 0 ? (
              stats.upcomingSessions.map((session, index) => (
                <div key={index} className="flex items-start p-3 border-b last:border-b-0">
                  <div className="mr-4 p-2 rounded-full bg-blue-50">
                    <Calendar className="text-blue-500" size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{session.groupName}</p>
                    <p className="text-sm text-gray-500">{session.trainingTitle}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-6 text-gray-500">
                No upcoming sessions this week
              </div>
            )}
            <div className="text-center pt-2">
              <button className="text-sm text-blue-500 hover:text-blue-700">
                View all sessions →
              </button>
            </div>
          </div>
        </Card>
        
        {/* Recent Activity */}
        <Card title="Recent Activity" className="lg:col-span-2">
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start p-3 border-b last:border-b-0">
                  <div className="mr-4 p-2 rounded-full bg-gray-100">
                    {activity.icon === 'Users' ? (
                      <Users className="text-blue-500" size={18} />
                    ) : activity.icon === 'DollarSign' ? (
                      <DollarSign className="text-green-500" size={18} />
                    ) : activity.icon === 'Layers' ? (
                      <Layers className="text-purple-500" size={18} />
                    ) : (
                      <Clock className="text-yellow-500" size={18} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-6 text-gray-500">
                No recent activity to display
              </div>
            )}
            <div className="text-center pt-2">
              <button className="text-sm text-blue-500 hover:text-blue-700">
                View all activity →
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;