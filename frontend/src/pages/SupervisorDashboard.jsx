import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supervisorApi } from '../api/client';

const SupervisorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [livePatrols, setLivePatrols] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [guardsOnDuty, setGuardsOnDuty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [patrols, alertsData, guards] = await Promise.all([
        supervisorApi.getLivePatrols(),
        supervisorApi.getAlerts(),
        supervisorApi.getGuardsOnDuty()
      ]);

      setLivePatrols(patrols.data);
      setAlerts(alertsData.data);
      setGuardsOnDuty(guards.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
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
      day: 'numeric'
    });
  };

  const getTimeDifference = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = Math.floor((now - start) / 1000 / 60); // minutes
    
    if (diff < 60) {
      return `${diff}m ago`;
    } else {
      const hours = Math.floor(diff / 60);
      return `${hours}h ago`;
    }
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
            <h1 className="text-2xl font-bold drop-shadow-lg">Supervisor Dashboard</h1>
            <p className="text-sm text-white/90">Welcome, {user?.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-green-500/80 backdrop-blur-sm rounded-lg hover:bg-green-600/80 border border-white/30 transition-all shadow-lg"
            >
              Admin Panel
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 border border-white/30 transition-all shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Active Patrols</p>
                <p className="text-3xl font-bold text-white drop-shadow-lg">{livePatrols.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-blue-300/50">
                <span className="text-2xl">👮</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Guards on Duty</p>
                <p className="text-3xl font-bold text-white drop-shadow-lg">{guardsOnDuty.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-300/50">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Alerts</p>
                <p className="text-3xl font-bold text-white drop-shadow-lg">{alerts.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-300/50">
                <span className="text-2xl">⚠</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl mb-4 border border-white/20">
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'live'
                  ? 'border-b-2 border-blue-400 text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Live Patrols
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'alerts'
                  ? 'border-b-2 border-blue-400 text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Alerts {alerts.length > 0 && `(${alerts.length})`}
            </button>
            <button
              onClick={() => setActiveTab('guards')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'guards'
                  ? 'border-b-2 border-blue-400 text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Guards on Duty
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Live Patrols Tab */}
          {activeTab === 'live' && (
            <>
              {livePatrols.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  No active patrols at the moment
                </div>
              ) : (
                livePatrols.map((patrol) => (
                  <div key={patrol.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{patrol.guard.name}</h3>
                        <p className="text-gray-600">{patrol.site.name}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Started</p>
                        <p className="font-medium">
                          {formatTime(patrol.startTime)} - {formatDate(patrol.startTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium">{getTimeDifference(patrol.startTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Checkpoints Logged</p>
                        <p className="font-medium">{patrol.patrolLogs?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Activity</p>
                        <p className="font-medium">
                          {patrol.patrolLogs?.[0]
                            ? getTimeDifference(patrol.patrolLogs[0].timestamp)
                            : 'No activity'}
                        </p>
                      </div>
                    </div>

                    {patrol.patrolLogs && patrol.patrolLogs.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Recent Checkpoints
                        </p>
                        <div className="space-y-2">
                          {patrol.patrolLogs.slice(0, 3).map((log) => (
                            <div
                              key={log.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-700">{log.checkpoint.name}</span>
                              <span className="text-gray-500">{formatTime(log.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <>
              {alerts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  No alerts at the moment
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                      alert.severity === 'HIGH' ? 'border-red-500' : 'border-yellow-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alert.alertType === 'MISSED_CHECKPOINTS'
                          ? 'Missed Checkpoints'
                          : 'Inactive Guard'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          alert.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-2">
                      Guard: <span className="font-medium">{alert.guard.name}</span>
                    </p>
                    <p className="text-gray-700 mb-2">
                      Site: <span className="font-medium">{alert.site.name}</span>
                    </p>
                    <p className="text-gray-700">
                      Missed Checkpoints:{' '}
                      <span className="font-medium text-red-600">
                        {alert.missedCheckpoints} of {alert.totalCheckpoints}
                      </span>
                    </p>
                  </div>
                ))
              )}
            </>
          )}

          {/* Guards on Duty Tab */}
          {activeTab === 'guards' && (
            <>
              {guardsOnDuty.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  No guards on duty at the moment
                </div>
              ) : (
                guardsOnDuty.map((guard) => (
                  <div key={guard.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{guard.name}</h3>
                        <p className="text-gray-600">{guard.email}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        On Duty
                      </span>
                    </div>

                    {guard.shifts && guard.shifts.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Current Assignment
                        </p>
                        <p className="text-gray-700">
                          Site: <span className="font-medium">{guard.shifts[0].site.name}</span>
                        </p>
                        <p className="text-gray-600 text-sm">
                          Started: {formatTime(guard.shifts[0].startTime)}
                        </p>
                        {guard.shifts[0].patrolLogs?.[0] && (
                          <p className="text-gray-600 text-sm">
                            Last checkpoint: {getTimeDifference(guard.shifts[0].patrolLogs[0].timestamp)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadDashboardData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
