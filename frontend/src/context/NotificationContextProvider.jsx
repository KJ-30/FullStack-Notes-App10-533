import React, {useState} from "react";
import NotificationContext from "./NotificationContext";

const NotificationProvider = ({children}) => {
    const [notification, setNotification] = useState({message: '', show: false});

    const showNotification = (message) => {
        setNotification({message, show: true});
        setTimeout(() => setNotification({ message: '', show: false }), 3000);
    };

    return (
        <NotificationContext.Provider value={{ notification, showNotification }}>
          {children}
        </NotificationContext.Provider>
      );
};

export default NotificationProvider