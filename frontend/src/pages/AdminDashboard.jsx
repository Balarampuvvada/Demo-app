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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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

      <div className="container mx-auto p-4">
        {/* Message */}
        {message.text && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-300'
                : 'bg-red-50 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'sites'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="guard@security.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="GUARD">Guard</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="CLIENT">Client</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">All Users</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.role === 'GUARD' ? 'bg-green-100 text-green-800' :
                        user.role === 'SUPERVISOR' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Site</h2>
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">All Sites</h2>
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
                        <button
                          onClick={() => copyQRCodes(site)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Copy QR Codes
                        </button>
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
    </div>
  );
};

export default AdminDashboard;
