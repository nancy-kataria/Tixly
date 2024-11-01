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