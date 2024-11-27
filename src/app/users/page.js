"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";


export default function Page() {
  const [organizers, setOrganizers] = useState([]);
  const router = useRouter();
  const {user} = useUser();

  useEffect(() => {
    const fetchOrganizers = async () => {
      const url = `/api/users/get`;
      const res = await fetch(url, { method: `GET` });
      const data = await res.json();
      setOrganizers(data);
    };

    fetchOrganizers();
  }, []);

  return (
    <>
      <Navbar router={router} />
      <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">
          Organizers List
        </h1>
        <ul className="space-y-4">
          {organizers.length > 0 ? (
            organizers.map((organizer) => (
              <li
                key={organizer._id}
                className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
              >
                <div>
                  <strong className="text-lg text-gray-700">
                    {organizer.name}
                  </strong>
                  <p className="text-sm text-gray-500">{organizer.email}</p>
                </div>
              </li>
            ))
          ) : (
            <li className="text-center text-gray-600">No organizers found</li>
          )}
        </ul>
      </div>
    </>
  );
}
