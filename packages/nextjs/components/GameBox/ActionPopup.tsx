import React from "react";

export const ActionPopup = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="popup-container fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="popup-content bg-white p-6 rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  );
};
