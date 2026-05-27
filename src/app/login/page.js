"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {

    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const inputStyle = {
        width: "100%",
        borderRadius: "12px",
        border: "1px solid #cbd5e1",
        padding: "0.85rem",
        fontSize: "1rem",
        fontWeight: 600,
        color: "#0f172a",
        backgroundColor: "#f8fafc",
        caretColor: "#1e3a8a",
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
    };

    const focusInputStyle = {
        borderColor: "#2563eb",
        boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.2)",
        transform: "scale(1.01)",
    };

    const blurInputStyle = {
        borderColor: "#cbd5e1",
        boxShadow: "none",
        transform: "none",
    };

    const handleLogin = async () => {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (res.ok) {
    window.location.href = "/dashboard";
  } else {
    alert("Invalid credentials");
  }
};

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #4f46e5 100%)",
                padding: "1.5rem",
            }}
            aria-label="Login page"
        >
            <section
                style={{
                    width: "min(95vw, 420px)",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "20px",
                    boxShadow: "0 18px 35px rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(15, 23, 42, 0.25)",
                    padding: "2rem",
                    backdropFilter: "blur(10px)",
                    fontFamily: "'Inter', 'System UI', sans-serif",
                }}
            >
                <header style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                    <h1 style={{ fontSize: "1.9rem", margin: 0, color: "#0f172a" }}>Water Station</h1>
                    <p style={{ marginTop: "0.35rem", color: "#475569" }}>
                        Secure dashboard access
                    </p>
                </header>

                <style jsx>{`
                    .loginInput::placeholder {
                        color: #94a3b8;
                        opacity: 1;
                    }

                    .loginInput {
                        color: #0f172a;
                        font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
                        letter-spacing: 0.01em;
                    }

                    .loginInput:focus {
                        outline: none;
                    }
                `}</style>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin();
                    }}
                    style={{ display: "grid", gap: "1rem" }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label htmlFor="username" style={{ color: "#334155", fontWeight: 600 }}>
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            placeholder="Enter your username"
                            className="loginInput"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => {
                                Object.assign(e.target.style, focusInputStyle);
                            }}
                            onBlur={(e) => {
                                Object.assign(e.target.style, blurInputStyle);
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label htmlFor="password" style={{ color: "#334155", fontWeight: 600 }}>
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="Enter your password"
                            className="loginInput"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => {
                                Object.assign(e.target.style, focusInputStyle);
                            }}
                            onBlur={(e) => {
                                Object.assign(e.target.style, blurInputStyle);
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            borderRadius: "999px",
                            border: "none",
                            padding: "0.95rem",
                            background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                            color: "white",
                            fontWeight: 700,
                            letterSpacing: "0.02em",
                            fontSize: "1.05rem",
                            cursor: "pointer",
                            transition: "transform 0.2s ease, filter 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.filter = "brightness(1.06)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.filter = "none";
                        }}
                    >
                        Sign In
                    </button>

                    <p style={{ margin: 0, textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>
                        Need help? Contact admin@waterstation.example
                    </p>
                </form>
            </section>
        </main>
    );
}