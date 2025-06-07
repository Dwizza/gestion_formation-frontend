// src/pages/auth/PresidentLoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { presidentAPI } from '../../api/apiService';
import myImage from '../../logo/img2.png';

const PresidentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if president is already logged in
  useEffect(() => {
    console.log("Checking president authentication status");
    const sessionData = localStorage.getItem('tweadup_president');
    
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        console.log("Found president session data:", { 
          role: data.user?.role,
          expiryValid: data.expiry > Date.now(),
          tokenExists: !!data.token
        });
        
        if (data.expiry > Date.now() && data.token && data.user?.role === 'PRESIDENT') {
          console.log("President already logged in, redirecting to dashboard");
          navigate('/president/dashboard');
          return;
        } else {
          console.log("President session expired or invalid");
          localStorage.removeItem('tweadup_president');
        }
      } catch (error) {
        console.error("Error parsing president session data:", error);
        localStorage.removeItem('tweadup_president');
      }
    } else {
      console.log("No president session found");
    }
    
    setCheckingAuth(false);
  }, [navigate]);

  const validateForm = () => {
    let isValid = true;

    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError('Invalid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the form
    if (!validateForm()) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Use presidentAPI service instead of axios directly
      const response = await presidentAPI.login({
        email,
        password
      });
      
      // Verify that the user role is PRESIDENT before allowing access
      if (response.data.user && response.data.user.role === 'PRESIDENT') {
        // Store president session
        const sessionData = {
          user: response.data.user,
          token: response.data.token,
          expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        console.log("Storing president session data:", sessionData);
        localStorage.setItem('tweadup_president', JSON.stringify(sessionData));
        
        console.log("President login successful, redirecting to dashboard");
        navigate('/president/dashboard');
      } else {
        // User is not a president
        setError('Access denied: Only the president can access this portal');
      }
    } catch (error) {
      console.error('President login error:', error);
      setError('Invalid credentials or not authorized as president');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md animate-fade-in-down">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Top header with logo */}
          <div className=" p-2 pt-5 pb-1 flex justify-center items-center">
            <img src={myImage} width={70} height={70} alt="TweadUp Logo" />
          </div>

          <div className="p-8 pt-1">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">TweadUp Training Center</h2>
            <p className="text-gray-500 text-center mb-6">President Access Portal</p>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-r">
              <p>This area is restricted to the President only. The President can create and manage admin and trainer accounts.</p>
            </div>
            
            {error && (
              <div 
                className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r animate-fade-in" 
                role="alert"
              >
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="input-container">
                  <input
                    id="email"
                    type="email"
                    placeholder="president@tweadup.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`appearance-none block w-full px-3 py-3 border ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md`}
                  />
                </div>
                {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="input-container">
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`appearance-none block w-full px-3 py-3 border ${
                      passwordError ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:shadow-md`}
                  />
                </div>
                {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Access President Portal'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Not the president?{' '}
                <a 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 hover:scale-105 inline-block"
                >
                  Regular login
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresidentLoginPage;