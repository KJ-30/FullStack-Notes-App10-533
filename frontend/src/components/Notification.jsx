import React, { useEffect, useState } from 'react';
import NotificationContext from '../context/NotificationContext';
import { useContext } from 'react';

const NotificationSlider = () => {
  const { notification } = useContext(NotificationContext);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (notification.show) {
      setIsShowing(true);
      const timer = setTimeout(() => {
        setIsShowing(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div
      className={`mt-16 -mr-4 fixed top-4 right-4 transition-transform duration-300 ${
        isShowing ? 'transform translate-x-0 mr-2.5' : 'transform translate-x-full'
      }`}
    >
      <div className="bg-green-400 text-white px-4 py-2 rounded shadow-md relative overflow-hidden">
        {notification.message}
        <div className="absolute bottom-0 left-0 h-1 bg-lime-50 animate-scroll-line"></div>
      </div>
    </div>
  );
};

export default NotificationSlider;