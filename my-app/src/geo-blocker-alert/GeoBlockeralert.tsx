import React, { useState } from 'react';
import './CustomAlert.css'; // Optional: Style in a separate CSS file

type CustomAlertProps = {
  message: string;
  onClose?: () => void; // Optional callback for when the alert is closed
};

const CustomAlert: React.FC<CustomAlertProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

//   const showAlert = () => setIsVisible(true);
  const closeAlert = () => {
    setIsVisible(false);
    if (onClose) onClose(); // Trigger the callback if provided
  };

  return (
    <>
      {/* <button onClick={showAlert}>Show Alert</button> */}
      {isVisible && (
        <div>
          <div className="alert-overlay" />
          <div className="alert-box">
            <p>{message}</p>
            <button onClick={closeAlert}>Ok</button>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomAlert;
