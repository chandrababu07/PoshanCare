import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
      <h1 className="text-6xl font-extrabold text-emerald-600 mb-2">404</h1>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-sm">
        The route you are trying to access does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition"
      >
        Return Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
