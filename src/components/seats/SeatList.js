import SeatItem from "./SeatItem.js";


export default function SeatList({seats, updateSeat, removeSeat, styles})
{
    return (
        <div className={styles.scrollableContainer}>
            {seats.map((seat, index) => (
            <SeatItem
            key={index}
            seat={seat}
            index={index}
            updateSeat={updateSeat}
            removeSeat={removeSeat}
            styles={styles}
            />
        ))}
        </div>
    );
}
export default SeatList;

import { useState } from "react";

const SeatList = ({ seats }) => {
  const [selectedSeat, setSelectedSeat] = useState(null); // Track selected seat
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal visibility

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Select Your Seat</h1>
      <div className="grid grid-cols-5 gap-4">
        {seats.map((seat, index) => (
          <button
            key={index}
            className={`p-2 border rounded ${
              seat.isAvailable
                ? "bg-green-300 hover:bg-green-500"
                : "bg-red-300 cursor-not-allowed"
            }`}
            disabled={!seat.isAvailable}
            onClick={() => handleSeatClick(seat)}
          >
            {seat.number}
          </button>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Seat Details</h2>
            <p>Seat Number: {selectedSeat.number}</p>
            <p>Price: ${selectedSeat.price}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
