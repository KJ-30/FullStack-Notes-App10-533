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
                    {note.cover_thumbnail || note.cover_image ? (
                        <div className="h-48 overflow-hidden">
                            <img
                                src={note.cover_thumbnail || note.cover_image}
                                alt={note.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                            <svg className="w-16 h-16 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    )}
                    <div className="p-6">
                        <div className="font-bold text-2xl mb-4 text-gray-800">{note.title}</div>
                        <p className="text-gray-700 text-base mb-4 line-clamp-3">{note.content}</p>
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