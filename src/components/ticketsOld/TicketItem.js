// components/SeatItem.js

export default function TicketItem({ ticket, index, updateTicket, removeTicket, styles }) {
    return (
      <div style={{ marginBottom: '10px' }}>
        <div>
            <label>Seat Number:</label>
            <input
            type="text"
            value={ticket.seat?.seatNumber}
            onChange={(e) => updateTicket(index, 'seat', {...ticket.seat, seatNumber: e.target.value})}
            className={styles.input}
            />
    
            <label>Row:</label>
            <input
            type="text"
            value={ticket.seat?.row}
            onChange={(e) => updateTicket(index, 'seat', {...ticket.seat, row: e.target.value})}
            className={styles.input}

            />
    
            <label>Section:</label>
            <input
            type="text"
            value={ticket.seat?.section}
            onChange={(e) => updateTicket(index, 'seat', {...ticket.seat, section: e.target.value})}
            className={styles.input}
            />
        </div>
        <label>Price: </label>
        <input
          type="text"
          value={ticket.price}
          onChange={(e) => updateTicket(index, 'price', e.target.value)}
          className={styles.input}
        />
        <label>Status: </label>
        <select
          type="text"
          value={ticket.status}
          onChange={(e) => updateTicket(index, 'status', e.target.value)}
          className={styles.select}
          >
          <option value="Available">Available</option>
          <option value="Sold">Sold</option>
        </select>
        <button className={styles.button}  onClick={() => removeTicket(index)}>Remove Ticket</button>

      </div>
    );
  }
  
