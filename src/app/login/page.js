'use client';
import { useState } from 'react';
import styles from "@/styles/Login.module.css";

export default function LoginPage() {
    console.log("Log in page loaded");
  const [isLogin, setIsLogin] = useState(true);  // Toggle between login and signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');  // Only used for signup
  const [userType, setUserType] = useState('User');  // Only used for signup

  const handleSubmit = async (e) => {
    console.log("Login/Signup clicked)");

    e.preventDefault();
    const url = isLogin ? '/api/auth/signin' : '/api/auth/signup';
    const body = isLogin
      ? { email, password }
      : { name, email, password, userType };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok) {
      alert(isLogin ? 'Login successful!' : 'Signup successful!');
      // Optionally, redirect to the homepage or another page
    } else {
      alert(data.error || 'An error occurred');
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>{isLogin ? 'Sign In' : 'Sign Up'}</h1>

      <form onSubmit={handleSubmit} style={{ display: 'inline-block', textAlign: 'left' }}>
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className={styles.input}
            >
              <option value="User">User</option>
              <option value="Organizer">Organizer</option>
            </select>
          </>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          />
        <button type="submit" style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
          {isLogin ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        style={{ display: 'block', marginTop: '1rem', color: '#0070f3' }}
      >
        {isLogin ? 'Create an account' : 'Have an account? Login'}
      </button>
    </div>
  );
}
