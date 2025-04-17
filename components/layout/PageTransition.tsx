import React from 'react';

const PageTransition: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="page-transition min-h-screen">
      {children}
    </div>
  );
};

export default PageTransition;
