// utilities/showToast.ts

import { createRoot } from 'react-dom/client';
import { ToastContainer } from "../components/Toast/ToastContainer";

export const showToast = (toastMessage: string, duration: number = 5000) => {
  
  let toastContainer = document.getElementById("toast");
  
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast";
    document.body.appendChild(toastContainer);
  }

    // Create root and render
    const root = createRoot(toastContainer);
    root.render(<ToastContainer message={toastMessage} duration={duration} />);
    
   // Cleanup after duration
   setTimeout(() => {
    root.unmount();
    toastContainer?.remove();
  }, duration);
  
};
