// import { useState } from "react";
// import { supportService } from "../services/supportService";
// import { toast } from "react-toastify";

// export default function CreateTicket() {
//   const [form, setForm] = useState({
//     description: "",
//     category: "Other",
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       await supportService.createTicket(form);
//       toast.success("Ticket Created");

//       setForm({
//         description: "",
//         category: "Account",
//       });

//     } catch (err) {
//       toast.error("Failed to create ticket");
//     }
//   };

//   return (
//     <div style={{ padding: 30 }}>
//       <h2>Create Support Ticket</h2>

//       <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//         <textarea
//           placeholder="Description"
//           value={form.description}
//           onChange={(e) => setForm({ ...form, description: e.target.value })}
//         />

//         <select
//           value={form.category}
//           onChange={(e) => setForm({ ...form, category: e.target.value })}
//         >
//           <option>Payment</option>
//           <option>Property</option>
//           <option>Account</option>
//           <option>Other</option>
//         </select>

//         <button type="submit">Submit Ticket</button>
//       </form>
//     </div>
//   );
// }


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supportService } from "../services";
import { toast } from "react-toastify";

export default function CreateTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "Other",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login first");
      return;
    }

    try {
      await supportService.createTicket({
        user: user._id,
        subject: form.subject,
        message: form.message,
        category: form.category,
      });
      toast.success("Ticket Created");
      setForm({ subject: "", message: "", category: "Other" });
    } catch (err) {
      toast.error("Failed to create ticket");
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Create Support Ticket</h2>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            padding: "10px 16px",
            background: "#ffffff",
            border: "1px solid rgba(124,58,237,0.22)",
            borderRadius: 10,
            color: "#7c3aed",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          ← Back to Website
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <textarea
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option>Payment</option>
          <option>Property</option>
          <option>Account</option>
          <option>Other</option>
        </select>
        <button type="submit">Submit Ticket</button>
      </form>
    </div>
  );
}
