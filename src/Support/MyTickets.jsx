import { useEffect, useState } from "react";
import axios from "axios";

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    axios.get("/api/support/my").then((res) => setTickets(res.data));
  }, []);

  return (
    <div>
      {tickets.map((t) => (
        <div key={t._id}>
          <h3>{t.subject}</h3>
          <p>Status: {t.status}</p>
        </div>
      ))}
    </div>
  );
};

export default MyTickets;