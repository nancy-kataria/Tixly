// components/SeatItem.js
export default function SeatItem({ seat, index, updateSeat, removeSeat, styles }) {
    return (
      <div style={{ marginBottom: '10px' }}>
        <label>Seat Number:</label>
        <input
          type="text"
          value={seat.seatNumber}
          onChange={(e) => updateSeat(index, 'seatNumber', e.target.value)}
          className={styles.input}
        />
  
        <label>Row:</label>
        <input
          type="text"
          value={seat.row}
          onChange={(e) => updateSeat(index, 'row', e.target.value)}
          className={styles.input}

        />
  
        <label>Section:</label>
        <input
          type="text"
          value={seat.section}
          onChange={(e) => updateSeat(index, 'section', e.target.value)}
          className={styles.input}

        />
  
        <button className={styles.button}  onClick={() => removeSeat(index)}>Remove Seat</button>
      </div>
    );
  }
  