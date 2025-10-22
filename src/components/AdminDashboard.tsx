import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AdminDashboardProps {
  companyId: string;
  onNavigate: (screen: string, params?: any) => void;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalHours: number;
  averageHoursPerEmployee: number;
  totalWages: number;
  period: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  totalHours: number;
  totalEntries: number;
}

interface TimeEntry {
  _id: string;
  employeeId: {
    firstName: string;
    lastName: string;
  };
  checkInTime: string;
  checkOutTime?: string;
  type: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ companyId, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<TimeEntry[]>([]);
  const [employeePerformance, setEmployeePerformance] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    loadDashboardData();
  }, [companyId, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://192.168.0.208:3001/api/admin/dashboard/${companyId}?period=${selectedPeriod}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.data.statistics);
        setRecentActivity(data.data.recentActivity);
        setEmployeePerformance(data.data.employeePerformance);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'week': return 'Last 7 Days';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      default: return 'Last 7 Days';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => onNavigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <Text style={styles.periodLabel}>Viewing: {getPeriodText(selectedPeriod)}</Text>
        <View style={styles.periodButtons}>
          {['week', 'month', 'quarter'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Statistics Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>{stats.totalEmployees}</Text>
              <Text style={styles.statLabel}>Total Employees</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
              <Text style={styles.statNumber}>{stats.activeEmployees}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#FF9500" />
              <Text style={styles.statNumber}>{stats.totalHours.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={24} color="#FF3B30" />
              <Text style={styles.statNumber}>${stats.totalWages.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Wages</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('EmployeeManagement')}
          >
            <Ionicons name="people" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Manage Employees</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('PayrollManagement')}
          >
            <Ionicons name="cash" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Payroll</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('Reports')}
          >
            <Ionicons name="bar-chart" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('Analytics')}
          >
            <Ionicons name="analytics" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivity}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => onNavigate('TimeEntries')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentActivity.length > 0 ? (
          recentActivity.slice(0, 5).map((entry, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons 
                  name={entry.type === 'checkin' ? 'log-in' : 'log-out'} 
                  size={16} 
                  color={entry.type === 'checkin' ? '#34C759' : '#FF3B30'} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  {entry.employeeId.firstName} {entry.employeeId.lastName} {entry.type === 'checkin' ? 'checked in' : 'checked out'}
                </Text>
                <Text style={styles.activityTime}>
                  {formatDate(entry.checkInTime)} at {formatTime(entry.checkInTime)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No recent activity</Text>
        )}
      </View>

      {/* Employee Performance */}
      <View style={styles.employeePerformance}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          <TouchableOpacity onPress={() => onNavigate('EmployeePerformance')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {employeePerformance.length > 0 ? (
          employeePerformance.slice(0, 5).map((employee, index) => (
            <View key={index} style={styles.performanceItem}>
              <View style={styles.performanceRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.performanceContent}>
                <Text style={styles.employeeName}>
                  {employee.firstName} {employee.lastName}
                </Text>
                <Text style={styles.performanceStats}>
                  {employee.totalHours.toFixed(1)}h • {employee.totalEntries} entries
                </Text>
              </View>
              <View style={styles.performanceScore}>
                <Ionicons name="trophy" size={16} color="#FFD700" />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No performance data available</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  settingsButton: {
    padding: 8,
  },
  periodSelector: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  periodLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    padding: 20,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
  },
  recentActivity: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  employeePerformance: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  performanceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  performanceContent: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  performanceStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  performanceScore: {
    marginLeft: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default AdminDashboard;
