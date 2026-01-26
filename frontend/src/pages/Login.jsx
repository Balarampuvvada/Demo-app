import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ email, password });
      
      // Redirect based on role
      if (user.role === 'GUARD') {
        navigate('/guard');
      } else if (user.role === 'SUPERVISOR') {
        navigate('/supervisor');
      } else {
        // Invalid role - redirect to login
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background with your custom image - NO OVERLAY FOR TESTING */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/images/security-background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Dark overlay - uncomment to add back */}
      {/* <div className="absolute inset-0 bg-black/50" /> */}

      {/* Security badge icon overlay */}
      <div className="absolute top-20 right-20 opacity-5">
        <svg className="w-64 h-64" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14.5l-3.5-3.5L8.91 11.6 11 13.69l4.59-4.59L17 10.5l-6 6z"/>
        </svg>
      </div>
      <div className="absolute bottom-20 left-20 opacity-5">
        <svg className="w-48 h-48" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
        </svg>
      </div>

      {/* Login Card - Blurred and Transparent */}
      <div className="max-w-md w-full mx-4 space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl z-10 border border-white/20">
        <div>
          {/* Security Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-500/80 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14.5l-3.5-3.5L8.91 11.6 11 13.69l4.59-4.59L17 10.5l-6 6z"/>
            </svg>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white drop-shadow-lg">
            Security Patrol Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-white/90 drop-shadow">
            Digital Checkpoint Verification System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/50 text-white px-4 py-3 rounded-lg shadow-lg">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/30 placeholder-white/70 text-white bg-white/10 backdrop-blur-sm rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/30 placeholder-white/70 text-white bg-white/10 backdrop-blur-sm rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500/80 backdrop-blur-sm hover:bg-blue-600/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 shadow-lg transition-all"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
          <p className="text-xs text-white font-semibold mb-2 drop-shadow">🔐 Demo Credentials:</p>
          <div className="space-y-1">
            <p className="text-xs text-white/90"><span className="font-medium">Guard:</span> guard1@security.com</p>
            <p className="text-xs text-white/90"><span className="font-medium">Supervisor:</span> supervisor@security.com</p>
            <p className="text-xs text-white font-medium mt-2">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
