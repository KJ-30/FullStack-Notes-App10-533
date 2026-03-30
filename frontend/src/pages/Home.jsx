import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import NotificationSlider from "../components/Notification";
import NotificationContext from "../context/NotificationContext";


export default function Home() {
    const [notes, setNotes] = useState([])
    const navigate = useNavigate();
    const {showNotification} = useContext(NotificationContext);

    useEffect(() => {
        getNotes();
    }, [])

    const getNotes = () => {
        api.get("notes/").
            then((response) => response.data)
            .then((data) => { setNotes(data) })
            .catch((error) => showNotification(`Error: ${error.message}`));
    };

    const deleteNote = (id) => {
        api.delete(`notes/${id}/delete/`)
            .then((response => {
                if (response.status === 204) {
                    showNotification("Note Deleted Successfully!");
                    setNotes(notes.filter(note => note.id !== id)); // Remove deleted note from state
                } else {
                    showNotification("Error Deleting Note");
                }
            }))
            .catch((error) => showNotification(`Error: ${error.message}`));
        getNotes();
    }

    const onEdit = (id) => {
        navigate(`/edit-note/${id}`);
    }

    return (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            <NotificationSlider/>
            {notes.map((note) => (
                <div key={note.id} className="bg-white shadow-xl rounded-lg overflow-hidden transition transform hover:scale-105 hover:shadow-2xl">
                    <div className="p-6">
                        <div className="font-bold text-2xl mb-4 text-gray-800">{note.title}</div>
                        <p className="text-gray-700 text-base mb-4">{note.content}</p>
                        <div className="text-gray-600 text-sm mb-4">
                            <p>Created: {new Date(note.created_at).toLocaleDateString()}</p>
                            <p>Last Updated: {new Date(note.updated_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex justify-between">
                            <button
                                onClick={() => onEdit(note.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => deleteNote(note.id)}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}