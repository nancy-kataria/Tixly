import React from "react";

function VenueListModal({
  venueList,
  setFormData,
  formData,
  closeModal,
  setSelectedVenue,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-gray-800">
        <h2 className="text-xl font-semibold mb-4">
          Select a Venue for your event
        </h2>
        {venueList.map((venue) => (
          <div
            key={venue._id}
            onClick={() => {
              setFormData({
                ...formData,
                venue: venue._id,
              });
              setSelectedVenue(venue);
            }}
            className="w-full max-w-lg p-4 bg-white border border-gray-300 rounded-lg shadow-md flex items-center space-x-4"
          >
            {/* venue Details */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{venue.name}</h2>
              <div className="text-gray-600 mt-2">
                <p className="text-sm font-medium">
                  📍 Address: {venue.address}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end space-x-4">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default VenueListModal;
