'use client';
import { useState, useEffect } from 'react';
import styles from "@/styles/Testing.module.css";
import TicketList from "@/components/ticketsOld/TicketList";


export default function EventTestingPage({ eventData }) {
    const[_id, setId] = useState(eventData?._id || '');
    const[organizerId, setOrgId] = useState(eventData?.organizerId || '');
    const[venueID, setVenueId] = useState(eventData?.venueId || '');
    const[ticketPrice, setTicketPrice] = useState('');
    const [eventName, setEventName] = useState(eventData?.eventName || '');
    const [eventDate, setDate] = useState(eventData?.eventDate || ''); // havent used it yet
    const [tickets, setTickets] = useState(eventData?.tickets || []);
    const [jsonData, setJsonData] = useState(null);


  // Add a new seat to the seats array
  const addTicket = () => {
    setTickets([...tickets, {seat:{ seatNumber: '', row: '', section: '' }, price:'', status:'Available'}]);
  };

  // Update a specific seat in the seats array
  const updateTicket = (index, field, value) => {
    const updatedTickets = tickets.map((ticket, i) =>
      i === index ? { ...ticket, [field]: value } : ticket
    );
    setTickets(updatedTickets);
  };

  // Remove a specific seat from the seats array
  const removeTicket = (index) => {
    setTickets(tickets.filter((_, i) => i !== index));
  };

  // Save the Event data to the server
  const postRequest = async () => {
    const payload = { eventName: eventName, organizerId:organizerId, venue:venueID , tickets, ticketPrice };
    const response = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      alert('Event saved successfully!');
    } else {
      alert('Error saving Event');
    }
  };

  const getRequest = async(e) => {
    e.preventDefault();
    console.log("Event get request");
    
    try {
        const url = `/api/events/get/eventID/${_id}`;
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

  const putRequest = async(e)=>{

  }

  return (
    <div>

    <div className={styles['form-container']}>
      <h1>{eventData ? 'Edit Event' : 'Add New Event'}</h1>
      
      <div>
      <label>Event Name:  </label>
      <input
        type="text"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        className={styles.input}
      />
      </div>
      <div>
      <label>Organizer ID:  </label>
      <input
        type="text"
        value={organizerId}
        onChange={(e) => setOrgId(e.target.value)}
        className={styles.input}
      />
      <label>Venue ID:  </label>
      <input
        type="text"
        value={venueID}
        onChange={(e) => setVenueId(e.target.value)}
        className={styles.input}
      />
    </div>
    <label>Ticket Price:  </label>
      <input
        type="number"
        value={ticketPrice}
        onChange={(e) => setTicketPrice(e.target.value)}
        className={styles.input}
      />
    <div>
      
    </div>
      <h2>Seats</h2>
        <TicketList tickets={tickets} updateTicket={updateTicket} removeTicket={removeTicket} styles={styles}/>

      <button className={styles.button} onClick={addTicket}>Add Ticket</button>
      <button className={styles.button} onClick={postRequest}>Save Event</button>


    <div>
      <form onSubmit={putRequest} style={{ display: 'inline-block', textAlign: 'left' }}>
      <label>ID:  </label>
        <input
        type="text"
        value={_id}
        onChange={(e) => setId(e.target.value)}
        className={styles.input}
        />

        <button type="submit" className={styles.button}>Update Event</button>

        </form>
    </div>


    <div>
      <form onSubmit={getRequest} style={{ display: 'inline-block', textAlign: 'left' }}>
      <label>ID:  </label>
        <input
        type="text"
        value={_id}
        onChange={(e) => setId(e.target.value)}
        className={styles.input}
        />

        <button type="submit" className={styles.button}>Get Event</button>
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
