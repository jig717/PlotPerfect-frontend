import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { handleGoogleLogin } from "../../utils/authUtils";
import { useAuth } from '../../context/AuthContext'; 


const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9ff", padding: "20px" },
  card: { background: "#fff", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 25px 50px rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.08)" },
  title: { fontSize: "28px", fontWeight: "700", textAlign: "center", marginBottom: "5px", color: "#1a0a2e" },
  sub: { textAlign: "center", color: "rgba(26,10,46,0.6)", marginBottom: "25px", fontSize: "14px" },
  input: { width: "100%", padding: "14px 14px 14px 45px", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "12px", fontSize: "14px", background: "#f9f9ff", color: "#1a0a2e", outline: "none", boxSizing: "border-box", marginBottom: "15px" },
  icon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "rgba(124,58,237,0.5)" },
  inpWrap: { position: "relative", marginBottom: "15px" },
  toggle: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(124,58,237,0.5)", padding: "4px" },
  btn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "10px" },
  div: { display: "flex", alignItems: "center", margin: "20px 0" },
  line: { flex: 1, height: "1px", background: "rgba(124,58,237,0.1)" },
  or: { padding: "0 12px", color: "rgba(26,10,46,0.5)", fontSize: "12px" },
  ggBtn: { width: "100%", padding: "12px", background: "#ffffff", color: "#1a0a2e", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "12px", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "500" },
  link: { textAlign: "center", marginTop: "20px", color: "rgba(26,10,46,0.6)", fontSize: "13px" },
  a: { color: "#7c3aed", textDecoration: "none", fontWeight: "600" },
  err: { color: "#ef4444", fontSize: "11px", marginTop: "-12px", marginBottom: "8px" }
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const e = {};
    if (!email) e.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password required";
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

  //   try {
  //     const res = await fetch(LOGIN_API_URL, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email, password }),
  //     });
  //     const data = await res.json();
  //     if (res.ok) {
  //       toast.success("Login successful!");
  //       if (data.token) localStorage.setItem("token", data.token);
  //     } else {
  //       toast.error(data.message || "Login failed");
  //     }
  //   } catch {
  //     toast.error("Network error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // REPLACED: direct fetch → context login
 const result = await login({ email, password });
if (result.success) {
  toast.success("Login successful!");
  const stateRedirect = location.state?.from;
  const storedRedirect = sessionStorage.getItem('postLoginRedirect');
  const redirectTarget = stateRedirect || storedRedirect;

  if (redirectTarget && redirectTarget !== '/login' && redirectTarget !== '/signup') {
    sessionStorage.removeItem('postLoginRedirect');
    navigate(redirectTarget, { replace: true });
  } else {
    sessionStorage.removeItem('postLoginRedirect');
    const role = result.role;
    if (role === 'admin') navigate('/admin');
    else if (role === 'agent') navigate('/dashboard/agent');
    else if (role === 'owner') navigate('/dashboard/owner');
    else if (role === 'support') navigate('/support');
    else navigate('/');
  }
}
    setLoading(false);
  };
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(124,58,237,0.3)}.input::placeholder{color:rgba(26,10,46,0.4)}.input:focus{border-color:#7c3aed;background:#fff}`}</style>
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.sub}>Sign in to continue</p>
          <form onSubmit={handleSubmit}>
            <div style={styles.inpWrap}>
              <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <input style={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {err.email && <div style={styles.err}>{err.email}</div>}
            <div style={styles.inpWrap}>
              <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              <input style={styles.input} type={showPwd ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button style={styles.toggle} type="button" onClick={() => setShowPwd(!showPwd)}>{showPwd ? "👁️" : "👁️‍🗨️"}</button>
            </div>
            {err.password && <div style={styles.err}>{err.password}</div>}
            <button style={styles.btn} type="submit" disabled={loading}>{loading ? "Login in..." : "Login"}</button>
          </form>
          <div style={styles.div}><span style={styles.line}></span><span style={styles.or}>or</span><span style={styles.line}></span></div>
          <button style={styles.ggBtn} onClick={() => handleGoogleLogin(toast)}> Continue with Google</button>
          <p style={styles.link}>Don't have an account? <Link to="/signup" style={styles.a}>Sign Up</Link></p>
        </div>
      </div>
    </>
  );
}

