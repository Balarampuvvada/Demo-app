import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi, siteApi } from '../api/client';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);

  // User form state
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'GUARD'
  });

  // Site form state
  const [siteForm, setSiteForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    checkpoints: [{ name: '', latitude: '', longitude: '' }]
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await adminApi.getAllUsers();
        setUsers(response.data);
      } else if (activeTab === 'sites') {
        const response = await siteApi.getAllSites();
        setSites(response.data);
      }
    } catch (error) {
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // User Management
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminApi.createUser(userForm);
      showMessage('success', 'User created successfully!');
      setUserForm({ email: '', password: '', name: '', role: 'GUARD' });
      loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await adminApi.deleteUser(userId);
      showMessage('success', 'User deleted successfully');
      loadData();
    } catch (error) {
      showMessage('error', 'Failed to delete user');
    }
  };

  // Site Management
  const handleCreateSite = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...siteForm,
        latitude: siteForm.latitude ? parseFloat(siteForm.latitude) : null,
        longitude: siteForm.longitude ? parseFloat(siteForm.longitude) : null,
        checkpoints: siteForm.checkpoints.map(cp => ({
          name: cp.name,
          latitude: parseFloat(cp.latitude),
          longitude: parseFloat(cp.longitude)
        }))
      };

      const response = await adminApi.createSite(payload);
      
      showMessage('success', `Site created with ${response.data.site.checkpoints.length} checkpoints!`);
      
      // Show generated QR codes
      const qrCodes = response.data.site.checkpoints.map(cp => cp.qrCode).join('\n');
      console.log('Generated QR Codes:\n', qrCodes);
      
      setSiteForm({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        checkpoints: [{ name: '', latitude: '', longitude: '' }]
      });
      
      loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create site');
    } finally {
      setLoading(false);
    }
  };

  const addCheckpointField = () => {
    setSiteForm({
      ...siteForm,
      checkpoints: [...siteForm.checkpoints, { name: '', latitude: '', longitude: '' }]
    });
  };

  const removeCheckpointField = (index) => {
    const newCheckpoints = siteForm.checkpoints.filter((_, i) => i !== index);
    setSiteForm({ ...siteForm, checkpoints: newCheckpoints });
  };

  const updateCheckpointField = (index, field, value) => {
    const newCheckpoints = [...siteForm.checkpoints];
    newCheckpoints[index][field] = value;
    setSiteForm({ ...siteForm, checkpoints: newCheckpoints });
  };

  const handleDeleteSite = async (siteId) => {
    if (!confirm('Are you sure? This will delete all checkpoints and shift data for this site.')) return;

    try {
      await adminApi.deleteSite(siteId);
      showMessage('success', 'Site deleted successfully');
      loadData();
    } catch (error) {
      showMessage('error', 'Failed to delete site');
    }
  };

  const copyQRCodes = (site) => {
    const qrText = site.checkpoints.map(cp => 
      `${cp.name}: ${cp.qrCode}`
    ).join('\n');
    
    navigator.clipboard.writeText(qrText);
    showMessage('success', 'QR codes copied to clipboard!');
  };

  const viewQRCodes = async (site) => {
    setSelectedSite(site);
    setShowQRModal(true);
    setLoading(true);
    
    try {
      const response = await adminApi.getSiteQRCodes(site.id);
      setQrCodes(response.data.checkpoints);
    } catch (error) {
      showMessage('error', 'Failed to load QR codes');
      setShowQRModal(false);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (checkpoint) => {
    const link = document.createElement('a');
    link.href = checkpoint.qrCodeImage;
    link.download = `${checkpoint.name.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
    link.click();
  };

  const downloadAllQRCodes = () => {
    qrCodes.forEach((checkpoint, index) => {
      setTimeout(() => {
        downloadQRCode(checkpoint);
      }, index * 200); // Small delay between downloads
    });
  };

  const printQRCodes = () => {
    const printWindow = window.open('', '_blank');
    const qrHtml = qrCodes.map(cp => `
      <div style="page-break-after: always; padding: 40px; text-align: center;">
        <h2>${selectedSite.name}</h2>
        <h3>${cp.name}</h3>
        <img src="${cp.qrCodeImage}" style="width: 300px; height: 300px; margin: 20px auto;" />
        <p style="font-family: monospace; font-size: 14px;">${cp.qrCode}</p>
      </div>
    `).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Codes - ${selectedSite.name}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            @media print {
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>${qrHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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
            <h1 className="text-2xl font-bold drop-shadow-lg">Admin Dashboard</h1>
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
        {/* Message */}
        {message.text && (
          <div
            className={`mb-4 p-4 rounded-lg backdrop-blur-xl border shadow-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 text-white border-green-300/50'
                : 'bg-red-500/20 text-white border-red-300/50'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl mb-4 border border-white/20">
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-400 text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'sites'
                  ? 'border-b-2 border-blue-400 text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Site Management
            </button>
          </div>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create User Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold mb-4 text-white drop-shadow">Create New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="guard@security.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">
                    Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="GUARD" className="text-gray-900">Guard</option>
                    <option value="SUPERVISOR" className="text-gray-900">Supervisor</option>
                    <option value="CLIENT" className="text-gray-900">Client</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-blue-600/80 disabled:opacity-50 border border-white/30 shadow-lg transition-all"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>

            {/* Users List */}
            <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold mb-4 text-white drop-shadow">All Users</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                  >
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-white/70">{user.email}</p>
                      <span className={`text-xs px-2 py-1 rounded backdrop-blur-sm ${
                        user.role === 'GUARD' ? 'bg-green-500/30 text-white border border-green-300/50' :
                        user.role === 'SUPERVISOR' ? 'bg-blue-500/30 text-white border border-blue-300/50' :
                        'bg-purple-500/30 text-white border border-purple-300/50'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="px-3 py-1 text-white bg-red-500/30 hover:bg-red-500/50 rounded backdrop-blur-sm border border-red-300/50 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Site Management Tab */}
        {activeTab === 'sites' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Site Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold mb-4 text-white drop-shadow">Create New Site</h2>
              <form onSubmit={handleCreateSite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={siteForm.name}
                    onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Shopping Mall Alpha"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={siteForm.address}
                    onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Commerce Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={siteForm.latitude}
                      onChange={(e) => setSiteForm({ ...siteForm, latitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="40.7589"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={siteForm.longitude}
                      onChange={(e) => setSiteForm({ ...siteForm, longitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="-73.9851"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Checkpoints *</h3>
                    <button
                      type="button"
                      onClick={addCheckpointField}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      + Add Checkpoint
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {siteForm.checkpoints.map((cp, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Checkpoint {index + 1}</span>
                          {siteForm.checkpoints.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCheckpointField(index)}
                              className="text-red-600 text-sm hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Checkpoint Name"
                          value={cp.name}
                          onChange={(e) => updateCheckpointField(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Lat"
                            value={cp.latitude}
                            onChange={(e) => updateCheckpointField(index, 'latitude', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Lng"
                            value={cp.longitude}
                            onChange={(e) => updateCheckpointField(index, 'longitude', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          QR code will be auto-generated
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Site & Generate QR Codes'}
                </button>
              </form>
            </div>

            {/* Sites List */}
            <div className="bg-white/10 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold mb-4 text-white drop-shadow">All Sites</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {sites.map((site) => (
                  <div key={site.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{site.name}</h3>
                        <p className="text-sm text-gray-600">{site.address || 'No address'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteSite(site.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">
                          Checkpoints ({site.checkpoints?.length || 0})
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewQRCodes(site)}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            View QR Codes
                          </button>
                          <button
                            onClick={() => copyQRCodes(site)}
                            className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Copy Text
                          </button>
                        </div>
                      </div>
                      {site.checkpoints && site.checkpoints.length > 0 && (
                        <div className="space-y-1">
                          {site.checkpoints.map((cp) => (
                            <div key={cp.id} className="text-xs bg-white p-2 rounded">
                              <p className="font-medium">{cp.name}</p>
                              <p className="text-gray-600 font-mono">{cp.qrCode}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="sticky top-0 bg-white/20 backdrop-blur-xl border-b border-white/20 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white drop-shadow">
                QR Codes - {selectedSite?.name}
              </h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-white hover:text-white/70 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading QR codes...</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={downloadAllQRCodes}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download All
                    </button>
                    <button
                      onClick={printQRCodes}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Print All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {qrCodes.map((checkpoint) => (
                      <div key={checkpoint.id} className="border rounded-lg p-4 text-center">
                        <h3 className="font-semibold text-lg mb-2">{checkpoint.name}</h3>
                        <img
                          src={checkpoint.qrCodeImage}
                          alt={checkpoint.name}
                          className="w-64 h-64 mx-auto mb-3"
                        />
                        <p className="text-xs text-gray-600 font-mono mb-3 break-all">
                          {checkpoint.qrCode}
                        </p>
                        <button
                          onClick={() => downloadQRCode(checkpoint)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
