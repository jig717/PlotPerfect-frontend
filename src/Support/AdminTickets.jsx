const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    axios.get("/api/support").then((res) => setTickets(res.data));
  }, []);

  return (
    <div>
      {tickets.map((t) => (
        <div key={t._id}>
          <h3>{t.subject}</h3>
          <p>{t.message}</p>

          <select>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>
      ))}
    </div>
  );
};