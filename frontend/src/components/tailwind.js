import React from 'react';

const TailwindTest = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold text-blue-600 mb-4">
                  Tailwind CSS Test
                </h1>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Test Button
                </button>
                <p className="text-red-500 mt-4">
                  If you see styled elements, Tailwind is working!
                </p>
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-purple-500 rounded-full"></div>
                  <div className="w-16 h-16 bg-green-500 rounded-lg"></div>
                  <div className="w-16 h-16 bg-yellow-500 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest;