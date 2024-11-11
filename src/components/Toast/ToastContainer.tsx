import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Toast } from "./Toast";

interface ToastContainerProps {
  message: string;
  duration?: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ message, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  const toastContainer = document.getElementById("toast");
  return toastContainer ? ReactDOM.createPortal(< Toast message={message} />, toastContainer) : null;
};
