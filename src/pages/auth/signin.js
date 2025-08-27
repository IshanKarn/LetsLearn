import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/user-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok && data.roles) {
          setRoles(data.roles);
          setSelectedRole(data.roles[0] || "");
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };
    if (email) fetchRoles();
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await signIn("credentials", {
        email,
        password,
        role: selectedRole,
        redirect: false,
      });
      if (res?.error) {
        setError(res.error || "Invalid email or password");
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError("Sign-in failed. Please try again.");
      console.error("Sign-in error:", err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 mb-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 mb-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border p-2 mb-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={!roles.length}
        >
          <option value="" disabled>Select Role</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sign In
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
      <p className="mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-blue-500 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}