import TicketItem from "./TicketItem.js";

export default function TicketList({ tickets, updateTicket, removeTicket, styles }) {
    return (
      <div className={styles.scrollableContainer}>
        {tickets.map((ticket, index) => (
          <TicketItem
            key={index}
            ticket={ticket}
            index={index}
            updateTicket={updateTicket}
            removeTicket={removeTicket}
            styles={styles}
          />
        ))}
      </div>
    );
  }