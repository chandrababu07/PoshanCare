import React from 'react';

export const SearchPage: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Global Search Placeholder Page</h1>
      <p className="text-sm text-gray-500">Route: /search</p>
      <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
        Global application search for foods, recipes, and features will be implemented in future phases.
      </div>
    </div>
  );
};

export default SearchPage;
