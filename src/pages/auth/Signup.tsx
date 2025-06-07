// src/pages/auth/SignupPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import myImage from '../../logo/img.png';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page after a short delay
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md animate-fade-in-down">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Top header with logo */}
          <div className="bg-red p-2 pt-5 pb-1 flex justify-center items-center">
              <img src={myImage} width={70} height={70} alt="TweadUp Logo" />
          </div>
          
          <div className="p-8 pt-1">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Account Creation Restricted</h2>
            <p className="text-gray-600 text-center mb-6">
              Only the President can create new accounts for TweadUp Training Center.
            </p>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-r">
              <p>Please contact the President to request a new account. You'll be redirected to the login page shortly.</p>
            </div>

            <div className="mt-6 text-center">
              <div className="flex justify-center space-x-4">
                <a 
                  href="/login" 
                  className="text-red-600 hover:text-red-800 font-medium transition-all duration-200 hover:scale-105 inline-block"
                >
                  Go to Login
                </a>
                <a 
                  href="/president" 
                  className="text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 hover:scale-105 inline-block"
                >
                  President Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;