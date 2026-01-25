import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supervisorApi } from '../api/client';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedShift, setSelectedShift] = useState(null);

  useEffect(() => {
    loadShifts();
  }, [filter]);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter.toUpperCase();
      }
      params.limit = 50;

      const response = await supervisorApi.getAllShifts(params);
      setShifts(response.data);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = Math.floor((end - start) / 1000 / 60); // minutes
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const exportToCSV = () => {
    if (shifts.length === 0) return;

    const headers = ['Date', 'Guard', 'Site', 'Start Time', 'End Time', 'Duration', 'Checkpoints'];
    const rows = shifts.map(shift => [
      formatDate(shift.startTime),
      shift.guard.name,
      shift.site.name,
      formatTime(shift.startTime),
      shift.endTime ? formatTime(shift.endTime) : 'Active',
      calculateDuration(shift.startTime, shift.endTime),
      shift.patrolLogs?.length || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patrol-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/images/security-background.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative text-xl text-white drop-shadow-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Same background as login page */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/images/security-background.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Header with glass effect */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold drop-shadow-lg">Client Dashboard</h1>
            <p className="text-sm text-white/90">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 border border-white/30 transition-all shadow-lg"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="relative container mx-auto p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
            <p className="text-white/80 text-sm">Total Patrols</p>
            <p className="text-3xl font-bold text-white drop-shadow-lg">{shifts.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
            <p className="text-white/80 text-sm">Completed Patrols</p>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {shifts.filter(s => s.status === 'COMPLETED').length}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
            <p className="text-white/80 text-sm">Total Checkpoints</p>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {shifts.reduce((sum, s) => sum + (s.patrolLogs?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-4 mb-4 border border-white/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'all'
                    ? 'bg-blue-500/80 backdrop-blur-sm text-white border border-white/30'
                    : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'active'
                    ? 'bg-blue-500/80 backdrop-blur-sm text-white border border-white/30'
                    : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'completed'
                    ? 'bg-blue-500/80 backdrop-blur-sm text-white border border-white/30'
                    : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
                }`}
              >
                Completed
              </button>
            </div>

            <button
              onClick={exportToCSV}
              disabled={shifts.length === 0}
              className="px-4 py-2 bg-green-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-green-600/80 disabled:opacity-50 border border-white/30 shadow-lg transition-all"
            >
              Download CSV Report
            </button>
          </div>
        </div>

        {/* Patrol List */}
        <div className="space-y-4">
          {shifts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No patrols found
            </div>
          ) : (
            shifts.map((shift) => (
              <div key={shift.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{shift.site.name}</h3>
                    <p className="text-gray-600">Guard: {shift.guard.name}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      shift.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p className="font-medium">{formatDate(shift.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Start Time</p>
                    <p className="font-medium">{formatTime(shift.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">End Time</p>
                    <p className="font-medium">
                      {shift.endTime ? formatTime(shift.endTime) : 'In Progress'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-medium">
                      {calculateDuration(shift.startTime, shift.endTime)}
                    </p>
                  </div>
                </div>

                {/* Checkpoints */}
                {shift.patrolLogs && shift.patrolLogs.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-medium text-gray-700">
                        Checkpoints ({shift.patrolLogs.length})
                      </p>
                      <button
                        onClick={() =>
                          setSelectedShift(selectedShift === shift.id ? null : shift.id)
                        }
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {selectedShift === shift.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>

                    {selectedShift === shift.id && (
                      <div className="space-y-2">
                        {shift.patrolLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded"
                          >
                            <div>
                              <p className="font-medium text-sm">{log.checkpoint.name}</p>
                              <p className="text-xs text-gray-600">
                                Location: {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatTime(log.timestamp)}</p>
                              <p className="text-xs text-gray-600">{formatDate(log.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(!shift.patrolLogs || shift.patrolLogs.length === 0) && (
                  <div className="pt-4 border-t text-center text-gray-500 text-sm">
                    No checkpoints logged yet
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
