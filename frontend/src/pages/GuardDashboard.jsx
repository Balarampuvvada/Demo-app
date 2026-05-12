import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patrolApi, siteApi } from '../api/client';
import QRScanner from '../components/QRScanner';

const guardBackgroundStyle = {
  backgroundImage: `linear-gradient(135deg, rgba(5, 95, 70, 0.74), rgba(15, 118, 110, 0.56), rgba(14, 116, 144, 0.52)), url('/images/security-background.jpg')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
};

const GuardDashboard = () => {
  const { user, logout } = useAuth();
  const [activeShift, setActiveShift] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
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

  useEffect(() => {
    if (!activeShift || !navigator.geolocation) {
      return undefined;
    }

    const sendLiveLocation = (position) => {
      patrolApi.updateLiveLocation({
        shiftId: activeShift.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }).catch((err) => {
        console.error('Failed to update live location:', err);
      });
    };

    navigator.geolocation.getCurrentPosition(sendLiveLocation, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 10000
    });

    const watchId = navigator.geolocation.watchPosition(sendLiveLocation, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 10000
    });

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendLiveLocation, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 10000
      });
    }, 30000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [activeShift?.id]);

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
      // No active shift - could be because shift was ended
      setActiveShift(null);
    }
  };

  const handleStartShift = async () => {
    if (!selectedSite) {
      setMessage({ type: 'error', text: 'Please select a site' });
      return;
    }

    setLoading(true);
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await patrolApi.startShift({ 
              siteId: selectedSite,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setActiveShift(response.data);
            setMessage({ type: 'success', text: 'Shift started successfully!' });
          } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to start shift' });
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setMessage({ type: 'error', text: 'Location access denied. Please enable GPS to start shift.' });
          setLoading(false);
        }
      );
    } else {
      setMessage({ type: 'error', text: 'Geolocation not supported by your browser' });
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;

    setLoading(true);
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await patrolApi.endShift(activeShift.id, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setActiveShift(null);
            setMessage({ type: 'success', text: 'Shift ended successfully!' });
          } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to end shift' });
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setMessage({ type: 'error', text: 'Location access denied. Please enable GPS to end shift.' });
          setLoading(false);
        }
      );
    } else {
      setMessage({ type: 'error', text: 'Geolocation not supported by your browser' });
      setLoading(false);
    }
  };

  const handleQRScan = async (qrCode) => {
    if (!activeShift) {
      setMessage({ type: 'error', text: 'No active shift' });
      return;
    }
    
    // Prevent multiple scans in quick succession
    if (isScanning) {
      return;
    }
    
    setIsScanning(true);
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
              setLoading(false);
              setIsScanning(false);
              // Reload active shift to ensure we have current state
              await loadActiveShift();
            }
          },
          (error) => {
            setMessage({ type: 'error', text: 'Location access denied' });
            setLoading(false);
            setIsScanning(false);
          }
        );
      } else {
        setMessage({ type: 'error', text: 'Geolocation not supported' });
        setLoading(false);
        setIsScanning(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to process QR code' });
      setLoading(false);
      setIsScanning(false);
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Guard background */}
      <div 
        className="absolute inset-0"
        style={guardBackgroundStyle}
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Header with glass effect */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold drop-shadow-lg">Guard Dashboard</h1>
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

      <div className="relative container mx-auto p-4 space-y-6">
        {/* Message */}
        {message.text && (
          <div
            className={`p-4 rounded-lg backdrop-blur-xl border shadow-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 text-white border-green-300/50'
                : 'bg-red-500/20 text-white border-red-300/50'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Shift Control */}
        {!activeShift ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 text-white drop-shadow">Start Your Shift</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Select Site
                </label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="" className="text-gray-900">Choose a site...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id} className="text-gray-900">
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStartShift}
                disabled={loading || !selectedSite}
                className="w-full py-3 bg-green-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-green-600/80 disabled:opacity-50 border border-white/30 shadow-lg transition-all"
              >
                {loading ? 'Starting...' : 'Start Shift'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Active Shift Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white drop-shadow">Active Shift</h2>
                  <p className="text-white/80">{activeShift.site?.name}</p>
                </div>
                <span className="px-3 py-1 bg-green-500/30 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-green-300/50">
                  Active
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-white/90">
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
                  className="w-full py-3 bg-blue-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-blue-600/80 border border-white/30 shadow-lg transition-all"
                >
                  {showScanner ? 'Hide Scanner' : 'Scan Checkpoint'}
                </button>
                
                <button
                  onClick={handleEndShift}
                  disabled={loading}
                  className="w-full py-3 bg-red-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-600/80 disabled:opacity-50 border border-white/30 shadow-lg transition-all"
                >
                  {loading ? 'Ending...' : 'End Shift'}
                </button>
              </div>
            </div>

            {/* QR Scanner */}
            {showScanner && (
              <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold mb-4 text-white drop-shadow">Scan Checkpoint QR Code</h2>
                <QRScanner
                  onScan={handleQRScan}
                  onError={(err) => setMessage({ type: 'error', text: err })}
                />
              </div>
            )}

            {/* Patrol Logs */}
            {activeShift.patrolLogs && activeShift.patrolLogs.length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold mb-4 text-white drop-shadow">Today's Patrol Logs</h2>
                <div className="space-y-3">
                  {activeShift.patrolLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                    >
                      <div>
                        <p className="font-medium text-white">{log.checkpoint?.name}</p>
                        <p className="text-sm text-white/70">{formatTime(log.timestamp)}</p>
                      </div>
                      <span className="text-green-400">✓</span>
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
