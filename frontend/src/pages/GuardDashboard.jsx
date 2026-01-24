import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patrolApi, siteApi } from '../api/client';
import QRScanner from '../components/QRScanner';

const GuardDashboard = () => {
  const { user, logout } = useAuth();
  const [activeShift, setActiveShift] = useState(null);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [patrolHistory, setPatrolHistory] = useState([]);

  useEffect(() => {
    loadActiveShift();
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await siteApi.getAllSites();
      setSites(response.data);
    } catch (err) {
      console.error('Failed to load sites:', err);
    }
  };

  const loadActiveShift = async () => {
    try {
      const response = await patrolApi.getActiveShift();
      setActiveShift(response.data);
    } catch (err) {
      // No active shift
      console.log('No active shift');
    }
  };

  const handleStartShift = async () => {
    if (!selectedSite) {
      setMessage({ type: 'error', text: 'Please select a site' });
      return;
    }

    setLoading(true);
    try {
      const response = await patrolApi.startShift({ siteId: selectedSite });
      setActiveShift(response.data);
      setMessage({ type: 'success', text: 'Shift started successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to start shift' });
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;

    setLoading(true);
    try {
      await patrolApi.endShift(activeShift.id);
      setActiveShift(null);
      setMessage({ type: 'success', text: 'Shift ended successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to end shift' });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrCode) => {
    if (!activeShift) {
      setMessage({ type: 'error', text: 'No active shift' });
      return;
    }

    setLoading(true);
    try {
      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await patrolApi.logCheckpoint({
                shiftId: activeShift.id,
                qrCode,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });

              setMessage({ type: 'success', text: `Checkpoint logged: ${response.data.checkpoint.name}` });
              setShowScanner(false);
              
              // Reload active shift to get updated logs
              await loadActiveShift();
            } catch (err) {
              setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to log checkpoint' });
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            setMessage({ type: 'error', text: 'Location access denied' });
            setLoading(false);
          }
        );
      } else {
        setMessage({ type: 'error', text: 'Geolocation not supported' });
        setLoading(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to process QR code' });
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Guard Dashboard</h1>
            <p className="text-sm">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto p-4 space-y-6">
        {/* Message */}
        {message.text && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-300'
                : 'bg-red-50 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Shift Control */}
        {!activeShift ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Start Your Shift</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Site
                </label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a site...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStartShift}
                disabled={loading || !selectedSite}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Start Shift'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Active Shift Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Active Shift</h2>
                  <p className="text-gray-600">{activeShift.site?.name}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Started:</span> {formatTime(activeShift.startTime)} - {formatDate(activeShift.startTime)}
                </p>
                <p>
                  <span className="font-medium">Checkpoints Logged:</span> {activeShift.patrolLogs?.length || 0}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setShowScanner(!showScanner)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {showScanner ? 'Hide Scanner' : 'Scan Checkpoint'}
                </button>
                
                <button
                  onClick={handleEndShift}
                  disabled={loading}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Ending...' : 'End Shift'}
                </button>
              </div>
            </div>

            {/* QR Scanner */}
            {showScanner && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Scan Checkpoint QR Code</h2>
                <QRScanner
                  onScan={handleQRScan}
                  onError={(err) => setMessage({ type: 'error', text: err })}
                />
              </div>
            )}

            {/* Patrol Logs */}
            {activeShift.patrolLogs && activeShift.patrolLogs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Today's Patrol Logs</h2>
                <div className="space-y-3">
                  {activeShift.patrolLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{log.checkpoint?.name}</p>
                        <p className="text-sm text-gray-600">{formatTime(log.timestamp)}</p>
                      </div>
                      <span className="text-green-600">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GuardDashboard;
