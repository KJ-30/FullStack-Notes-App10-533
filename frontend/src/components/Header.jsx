import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";

export default function Header() {
  const token = localStorage.getItem(ACCESS_TOKEN);

  const navItems = [
    {
      name: 'Home',
      slug: "/",
      show: true // Always show Home
    },
    {
      name: "Login",
      slug: "/login",
      show: !token,
    },
    {
      name: "Register",
      slug: "/register",
      show: !token,
    },
    {
      name: "Create Task",
      slug: "/create-note",
      show: token,
    },
    {
      name: "Logout",
      slug: "/logout",
      show: token,
    },
  ];

  return (
    <nav className="bg-blue-500 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">
          Task Manager
        </div>
        <div className="flex space-x-4">
          {navItems.map((item) => 
            item.show && (
              <Link
                to={item.slug}
                key={item.name}
                className="text-white hover:bg-blue-700 px-3 py-2 rounded"
              >
                {item.name}
                
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
