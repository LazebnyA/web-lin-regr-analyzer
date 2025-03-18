import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Багатофакторна лінійна регресія
        </Link>

        <div>
          <Link to="/" className="px-4 py-2 hover:bg-blue-700 rounded">
            Головна
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;