import React from "react";
import { Link } from "react-router-dom";


export default function NotFound(){
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-center">
            <h1 className="text-9xl font-bold text-gray-300">404</h1>
            <p className="text-2xl md:text-3xl font-medium mt-8">
              Oops! Page not found
            </p>
            <p className="text-md md:text-lg text-gray-500 mt-4">
              The page you are looking for doesn't exist.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block px-6 py-2 text-sm font-medium leading-6 text-center text-white uppercase transition bg-blue-600 rounded shadow ripple hover:shadow-lg hover:bg-blue-800 focus:outline-none"
            >
              Go back to Home
            </Link>
          </div>
        </div>
      );
}