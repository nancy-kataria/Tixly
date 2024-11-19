'use client';
import { useState, useEffect } from 'react';
import styles from "@/styles/Testing.module.css";
import SeatList from "@/components/seats/SeatList";


export default function VenueTestingPage({ venueData }) {
    const[id, setId] = useState(venueData?.id || '');
    const [venueName, setVenueName] = useState(venueData?.name || '');
    const [address, setAddress] = useState(venueData?.address || '');
    const [seats, setSeats] = useState(venueData?.seats || []);
    const [jsonData, setJsonData] = useState(null);


  // Add a new seat to the seats array
  const addSeat = () => {
    setSeats([...seats, { seatNumber: '', row: '', section: '' }]);
  };

  // Update a specific seat in the seats array
  const updateSeat = (index, field, value) => {
    const updatedSeats = seats.map((seat, i) =>
      i === index ? { ...seat, [field]: value } : seat
    );
    setSeats(updatedSeats);
  };

  // Remove a specific seat from the seats array
  const removeSeat = (index) => {
    setSeats(seats.filter((_, i) => i !== index));
  };

  // Save the venue data to the server
  const postRequest = async () => {
    const payload = { name: venueName, address: address, seats };
    const response = await fetch('/api/venues/create/venue', {
      method: venueData ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      alert('Venue saved successfully!');
    } else {
      alert('Error saving venue');
    }
  };
const updateVenue = async(e)=>{

}
  const getRequest = async(e) => {
    e.preventDefault();
    
    try {
        const url = `/api/venues/get/fullVenue/${id}`;
        const res = await fetch(url, {method: `GET`});
        const data = await res.json();
        if (res.ok)
        {
            alert("Data retrieved successfully!");
            setJsonData(data);
        }
        else alert(data.error || 'Error fetching data');
    }
    catch(e)
    {
        console.error(e)
    }
  }

  return (
    <div>

    <div className={styles['form-container']}>
      <h1>{venueData ? 'Edit Venue' : 'Add New Venue'}</h1>
      
      <div>
      <label>Venue Name:  </label>
      <input
        type="text"
        value={venueName}
        onChange={(e) => setVenueName(e.target.value)}
        className={styles.input}
      />
      </div>
      <div>
      <label>Address:  </label>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className={styles.input}
      />
    </div>
      <h2>Seats</h2>
    <SeatList seats={seats} updateSeat={updateSeat} removeSeat={removeSeat} styles={styles}/>
      <button className={styles.button} onClick={addSeat}>Add Seat</button>
      <button className={styles.button} onClick={postRequest}>Save Venue</button>


    <div>
      <form onSubmit={updateVenue} style={{ display: 'inline-block', textAlign: 'left' }}>
      <label>ID:  </label>
        <input
        type="text"
        value={id}
        onChange={(e) => setId(e.target.value)}
        className={styles.input}
        />

        <button type="submit" className={styles.button}>updateVenue</button>

        </form>
    </div>


    <div>
      <form onSubmit={getRequest} style={{ display: 'inline-block', textAlign: 'left' }}>
      <label>ID:  </label>
        <input
        type="text"
        value={id}
        onChange={(e) => setId(e.target.value)}
        className={styles.input}
        />

        <button type="submit" className={styles.button}>Get Venue</button>
        </form>
    </div>
    {/* JSON Data Display */}
    {jsonData && (
        <div style={{ marginTop: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{color:"black"} }>JSON Response Data</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' , color: 'black'}}>
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </div>
      )}
    </div>

</div>

  );
}
