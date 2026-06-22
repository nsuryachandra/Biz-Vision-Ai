import React from 'react';

/**
 * ReportLayout Component Props
 * @param {Object} props
 * @param {Object} props.reportData - The structured JSON intelligence report containing the 11 blocks
 * @param {React.ReactNode} props.children - Rendered child nodes or templates
 */
const ReportLayout = ({ reportData, children }) => {
  return (
    <div>
      {/* Container Layout Scaffold */}
      {children}
    </div>
  );
};

export default ReportLayout;
