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

  const hasCoordinate = (value) => Number.isFinite(Number(value));

  const getLatestLocation = (patrol) => {
    if (hasCoordinate(patrol.currentLatitude) && hasCoordinate(patrol.currentLongitude)) {
      return {
        latitude: Number(patrol.currentLatitude),
        longitude: Number(patrol.currentLongitude),
        label: 'Live GPS',
        timestamp: patrol.lastLocationAt || patrol.updatedAt,
        source: 'live'
      };
    }

    const latestLog = patrol.patrolLogs?.find(
      (log) => hasCoordinate(log.latitude) && hasCoordinate(log.longitude)
    );

    if (latestLog) {
      return {
        latitude: Number(latestLog.latitude),
        longitude: Number(latestLog.longitude),
        label: latestLog.checkpoint?.name || 'Last checkpoint',
        timestamp: latestLog.timestamp,
        source: 'checkpoint'
      };
    }

    if (hasCoordinate(patrol.startLatitude) && hasCoordinate(patrol.startLongitude)) {
      return {
        latitude: Number(patrol.startLatitude),
        longitude: Number(patrol.startLongitude),
        label: 'Shift start',
        timestamp: patrol.startTime,
        source: 'start'
      };
    }

    if (hasCoordinate(patrol.site?.latitude) && hasCoordinate(patrol.site?.longitude)) {
      return {
        latitude: Number(patrol.site.latitude),
        longitude: Number(patrol.site.longitude),
        label: patrol.site.name,
        timestamp: patrol.startTime,
        source: 'site'
      };
    }

    return null;
  };

  const guardLocations = livePatrols
    .map((patrol) => ({
      patrol,
      location: getLatestLocation(patrol)
    }))
    .filter((item) => item.location);

  const mapCenter = guardLocations.length > 0
    ? guardLocations.reduce(
      (center, item) => ({
        latitude: center.latitude + item.location.latitude / guardLocations.length,
        longitude: center.longitude + item.location.longitude / guardLocations.length
      }),
      { latitude: 0, longitude: 0 }
    )
    : null;

  const getTileNumbers = (latitude, longitude, zoom) => {
    const latRad = latitude * Math.PI / 180;
    const n = 2 ** zoom;

    return {
      x: Math.floor((longitude + 180) / 360 * n),
      y: Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n)
    };
  };

  const getMarkerPosition = (latitude, longitude) => {
    if (!mapCenter) {
      return { left: '50%', top: '50%' };
    }

    const lngSpan = Math.max(
      0.01,
      Math.max(...guardLocations.map((item) => Math.abs(item.location.longitude - mapCenter.longitude))) * 2.8
    );
    const latSpan = Math.max(
      0.01,
      Math.max(...guardLocations.map((item) => Math.abs(item.location.latitude - mapCenter.latitude))) * 2.8
    );

    return {
      left: `${Math.min(92, Math.max(8, 50 + ((longitude - mapCenter.longitude) / lngSpan) * 100))}%`,
      top: `${Math.min(88, Math.max(12, 50 - ((latitude - mapCenter.latitude) / latSpan) * 100))}%`
    };
  };

  const getMapTiles = () => {
    if (!mapCenter) {
      return [];
    }

    const zoom = 15;
    const centerTile = getTileNumbers(mapCenter.latitude, mapCenter.longitude, zoom);
    const tiles = [];

    for (let row = -1; row <= 1; row += 1) {
      for (let col = -1; col <= 1; col += 1) {
        tiles.push({
          key: `${centerTile.x + col}-${centerTile.y + row}`,
          x: centerTile.x + col,
          y: centerTile.y + row,
          row: row + 1,
          col: col + 1,
          zoom
        });
      }
    }

    return tiles;
  };

  const openInGoogleMaps = (latitude, longitude) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank', 'noopener,noreferrer');
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
            backgroundImage: `url('/images/security-background.jpg')`,
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
          backgroundImage: `url('/images/security-background.jpg')`,
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
          <div className="flex border-b border-white/20 overflow-x-auto">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-6 py-3 font-medium transition-all shrink-0 ${
                activeTab === 'live'
                  ? 'border-b-2 border-blue-400 text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Live Patrols
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-6 py-3 font-medium transition-all shrink-0 ${
                activeTab === 'map'
                  ? 'border-b-2 border-blue-400 text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Guard Map
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 font-medium transition-all shrink-0 ${
                activeTab === 'alerts'
                  ? 'border-b-2 border-blue-400 text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Alerts {alerts.length > 0 && `(${alerts.length})`}
            </button>
            <button
              onClick={() => setActiveTab('guards')}
              className={`px-6 py-3 font-medium transition-all shrink-0 ${
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
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-8 text-center text-white/70 border border-white/20">
                  No active patrols at the moment
                </div>
              ) : (
                livePatrols.map((patrol) => (
                  <div key={patrol.id} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white drop-shadow">{patrol.guard.name}</h3>
                        <p className="text-white/80">{patrol.site.name}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/30 text-white rounded-full text-sm font-medium backdrop-blur-sm border border-green-300/50">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/70">Started</p>
                        <p className="font-medium text-white">
                          {formatTime(patrol.startTime)} - {formatDate(patrol.startTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/70">Duration</p>
                        <p className="font-medium text-white">{getTimeDifference(patrol.startTime)}</p>
                      </div>
                      <div>
                        <p className="text-white/70">Checkpoints Logged</p>
                        <p className="font-medium text-white">{patrol.patrolLogs?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-white/70">Last Activity</p>
                        <p className="font-medium text-white">
                          {patrol.patrolLogs?.[0]
                            ? getTimeDifference(patrol.patrolLogs[0].timestamp)
                            : 'No activity'}
                        </p>
                      </div>
                    </div>

                    {patrol.patrolLogs && patrol.patrolLogs.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-sm font-medium text-white mb-2">
                          Recent Checkpoints
                        </p>
                        <div className="space-y-2">
                          {patrol.patrolLogs.slice(0, 3).map((log) => (
                            <div
                              key={log.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-white/90">{log.checkpoint.name}</span>
                              <span className="text-white/60">{formatTime(log.timestamp)}</span>
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

          {/* Guard Map Tab */}
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl border border-white/20 overflow-hidden">
                <div className="p-4 border-b border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-white drop-shadow">Live Guard Locations</h2>
                    <p className="text-sm text-white/70">Updates automatically every 30 seconds</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/30 text-white rounded-full text-sm font-medium backdrop-blur-sm border border-green-300/50 w-fit">
                    {guardLocations.length} visible
                  </span>
                </div>

                {guardLocations.length === 0 ? (
                  <div className="h-[520px] flex items-center justify-center text-white/70">
                    No live GPS locations available yet
                  </div>
                ) : (
                  <div className="relative h-[520px] bg-slate-900 overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-90">
                      {getMapTiles().map((tile) => (
                        <img
                          key={tile.key}
                          src={`https://tile.openstreetmap.org/${tile.zoom}/${tile.x}/${tile.y}.png`}
                          alt=""
                          className="w-full h-full object-cover"
                          style={{ gridColumn: tile.col + 1, gridRow: tile.row + 1 }}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />

                    {guardLocations.map(({ patrol, location }, index) => {
                      const position = getMarkerPosition(location.latitude, location.longitude);

                      return (
                        <button
                          key={patrol.id}
                          type="button"
                          onClick={() => openInGoogleMaps(location.latitude, location.longitude)}
                          className="absolute -translate-x-1/2 -translate-y-full text-left group"
                          style={position}
                          title={`Open ${patrol.guard.name} in Google Maps`}
                        >
                          <span className="relative flex flex-col items-center">
                            <span className="w-10 h-10 rounded-full bg-blue-600 text-white border-2 border-white shadow-xl flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <span className="w-3 h-3 bg-blue-600 rotate-45 -mt-2 border-r-2 border-b-2 border-white shadow-xl" />
                            <span className="absolute left-1/2 top-11 -translate-x-1/2 min-w-44 rounded-lg bg-white text-slate-900 p-3 shadow-2xl opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                              <span className="block font-semibold">{patrol.guard.name}</span>
                              <span className="block text-sm text-slate-600">{patrol.site.name}</span>
                              <span className="block text-xs text-slate-500 mt-1">{location.label}</span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {guardLocations.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 text-center text-white/70 border border-white/20">
                    Start a guard shift with GPS to show the map.
                  </div>
                ) : (
                  guardLocations.map(({ patrol, location }, index) => (
                    <button
                      key={patrol.id}
                      type="button"
                      onClick={() => openInGoogleMaps(location.latitude, location.longitude)}
                      className="w-full bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-4 border border-white/20 text-left hover:bg-white/15 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-500/80 border border-white/50 text-white flex items-center justify-center font-bold shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white truncate">{patrol.guard.name}</h3>
                            <span className="px-2 py-0.5 bg-green-500/30 text-white rounded-full text-xs border border-green-300/50">
                              Live
                            </span>
                          </div>
                          <p className="text-sm text-white/80 truncate">{patrol.site.name}</p>
                          <p className="text-sm text-white/70 mt-2">{location.label}</p>
                          <p className="text-xs text-white/60 mt-1">
                            {getTimeDifference(location.timestamp)} - {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <>
              {alerts.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-8 text-center text-white/70 border border-white/20">
                  No alerts at the moment
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border-l-4 ${
                      alert.severity === 'HIGH' ? 'border-red-400' : 'border-yellow-400'
                    } border border-white/20`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-white drop-shadow">
                        {alert.alertType === 'MISSED_CHECKPOINTS'
                          ? 'Missed Checkpoints'
                          : 'Inactive Guard'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                          alert.severity === 'HIGH'
                            ? 'bg-red-500/30 text-white border border-red-300/50'
                            : 'bg-yellow-500/30 text-white border border-yellow-300/50'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-white mb-2">
                      Guard: <span className="font-medium">{alert.guard.name}</span>
                    </p>
                    <p className="text-white mb-2">
                      Site: <span className="font-medium">{alert.site.name}</span>
                    </p>
                    <p className="text-white">
                      Missed Checkpoints:{' '}
                      <span className="font-medium text-red-300">
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
                <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-8 text-center text-white/70 border border-white/20">
                  No guards on duty at the moment
                </div>
              ) : (
                guardsOnDuty.map((guard) => (
                  <div key={guard.id} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-white drop-shadow">{guard.name}</h3>
                        <p className="text-white/80">{guard.email}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/30 text-white rounded-full text-sm font-medium backdrop-blur-sm border border-green-300/50">
                        On Duty
                      </span>
                    </div>

                    {guard.shifts && guard.shifts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-sm font-medium text-white mb-2">
                          Current Assignment
                        </p>
                        <p className="text-white">
                          Site: <span className="font-medium">{guard.shifts[0].site.name}</span>
                        </p>
                        <p className="text-white/80 text-sm">
                          Started: {formatTime(guard.shifts[0].startTime)}
                        </p>
                        {guard.shifts[0].patrolLogs?.[0] && (
                          <p className="text-white/80 text-sm">
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
            className="px-6 py-2 bg-blue-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-blue-600/80 border border-white/30 shadow-lg transition-all"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
