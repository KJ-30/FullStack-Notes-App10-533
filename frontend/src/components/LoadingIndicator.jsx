import React from "react";

export default function LoadingIndicator() {
  return (
    <div className="flex justify-center items-center h-full mb-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
    </div>
  );
}
