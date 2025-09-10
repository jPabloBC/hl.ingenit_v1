"use client";

import LoadingSpinner from "./loading-spinner";

interface LoadingPageProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingPage({ 
  message = "Cargando...", 
  fullScreen = true 
}: LoadingPageProps) {
  const containerClass = fullScreen 
    ? "min-h-screen bg-gray9 flex items-center justify-center"
    : "flex items-center justify-center h-64";

  return (
    <div className={containerClass}>
      <LoadingSpinner message={message} size="md" />
    </div>
  );
}