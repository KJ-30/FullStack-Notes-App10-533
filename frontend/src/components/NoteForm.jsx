import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import NotificationContext from "../context/NotificationContext";

export default function NoteForm() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();
    const { id } = useParams();
    const { showNotification } = useContext(NotificationContext);

    useEffect(() => {
        if (id) {
            api.get(`notes/${id}/`).then((response) => {
                const note = response.data;
                setTitle(note.title);
                setContent(note.content);
            }).catch((error) => showNotification("error in fetching note's details"));
        }
    }, [id])

    const handleSubmit = (e) => {
        e.preventDefault();
        if (id) updateNote();
        else createNote();
    }

    const createNote = (e) => {
        api.post("notes/", { title, content })
            .then((response) => {
                if (response.status === 201) showNotification('Note Created Successfully!');
                else showNotification("Error Creating Note");
            }).catch((error) => showNotification(`Error: ${error.message}`));
        navigate("/");
    }

    const updateNote = (e) => {
        api.put(`notes/${id}/update/`, { title, content })
        .then((response) => {
            if (response.status === 200) showNotification("Note Updated Successfully!");
            else showNotification("Error Updating Note");
        }).catch((error) => showNotification(`Error: ${error.message}`));
        navigate("/");
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{id ? "Update Note" : "Create Note"}</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter Title"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="content" className="block text-gray-700 font-medium mb-2">Content</label>
                        <textarea
                            name="content"
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter Content"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                        />
                    </div>
                    <div className="text-center">
                        <input
                            type="submit"
                            value="Submit"
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out cursor-pointer"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
