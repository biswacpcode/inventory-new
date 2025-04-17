// components/Loading.tsx
import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="loader border-4 border-t-4 border-gray-600 border-t-black rounded-full w-8 h-8 animate-spin"></div>
      <style jsx>{`
        .loader {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;
