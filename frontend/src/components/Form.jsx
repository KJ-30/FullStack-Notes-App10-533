import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import api from "../api";
import LoadingIndicator from "./LoadingIndicator";
import NotificationContext from "../context/NotificationContext";
import NotificationSlider from "./Notification";

function Form({ route, method }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useContext(NotificationContext);

    const name = method === "login" ? "Login" : "Register";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const response = await api.post(route, {
                username,
                password
            });
            
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, response.data.access);
                localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
                navigate("/");
            } else {
                navigate("/login");
            }

        } catch (error) {
            if (error.response) {
                // API responded with a status code outside the range of 2xx
                const status = error.response.status;
                const errorMessage = error.response.data.detail || "An error occurred";
                
                if (status === 400) {
                    if (errorMessage.includes("already exists")) {
                        showNotification("User already exists. Please use a different username.");
                    } else if (errorMessage.includes("No active account found")) {
                        showNotification("No user found with these credentials.");
                    } else {
                        showNotification(errorMessage);
                    }
                } else {
                    showNotification(errorMessage);
                }
            } else if (error.request) {
                // No response received from API
                showNotification("No response from server. Please try again later.");
            } else {
                // Error setting up the request
                showNotification(`Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <NotificationSlider/>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-4 text-center">{name}</h1>
                <div className="mb-4">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter Username"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-6">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                {loading && <LoadingIndicator />}
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {name}
                </button>
            </form>
        </div>
    );
}

export default Form;
