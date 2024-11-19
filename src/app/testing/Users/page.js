'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from "@/styles/Testing.module.css";

export default function UserTestingPage() {
  const router = useRouter();

  const [_id, setId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const [userType, setUserType] = useState('User');
  const [jsonData, setJsonData] = useState(null);

  // Function for GET request (Get user info by ID or email)
  const getRequest = async (e) => {
    e.preventDefault();


    const url = _id ? `/api/users/get/profile/id/${_id}` : `/api/users/get/profile/email/${email}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (res.ok) {
        alert("Data retrieved successfully!");
        setJsonData(data);
      } else {
        alert(data.error || 'Error fetching data');
      }
    } catch (error) {
      alert('An error occurred');
      console.error(error);
    }
  };

  // Function for POST request (Create new user)
  const postRequest = async (e) => {
    e.preventDefault();

    const payload = { name, email, password, phone:phoneNumber, address, userType};
    try {
      const res = await fetch('/api/users/create/simpleUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert("User created successfully!");
      } else {
        alert(data.error || 'Error creating user');
      }
    } catch (error) {
      alert('An error occurred');
      console.error(error);
    }
  };

  // Function for PUT request (Update existing user)
  const putRequest = async (e) => {
    e.preventDefault();

    const payload = { name, email, password, userType };
    try {
      const res = await fetch(`/api/users/put/Name_Email_Password/${_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert("User updated successfully!");
      } else {
        alert(data.error || 'Error updating user');
      }
    } catch (error) {
      alert('An error occurred');
      console.error(error);
    }
  };

  return (
    <div className={styles['form-container']}>
      <h1>User Testing</h1> 
      {/* POST Request Form */}
      <div>
      <form onSubmit={postRequest} style={{ display: 'inline-block', textAlign: 'left' }}>
        <h2>Post</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
        />
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
        <input
          type="tel"
          placeholder="1111111111"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="111 test st"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={styles.input}
        />
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          className={styles.select}
        >
          <option value="User">User</option>
          <option value="Organizer">Organizer</option>
        </select>
        <button type="submit" className={styles.button}>Create User</button>
      </form>
      </div>

    {/* PUT Request Form */}
    <div>
      <form onSubmit={putRequest} style={{ display: 'inline-block', textAlign: 'left' }}>
        <h2>Put</h2>
        <input
          type="text"
          placeholder="User ID"
          value={_id}
          onChange={(e) => setId(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
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
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          className={styles.select}
        >
          <option value="User">User</option>
          <option value="Organizer">Organizer</option>
        </select>
        <button type="submit" className={styles.button}>Update User</button>
      </form>
    </div>

    {/* GET Request Form */}
    <div>
      <form onSubmit={getRequest} style={{ display: 'inline-block', textAlign: 'left' }}>
        <h2>Get</h2>
        <input
          type="text"
          placeholder="User ID"
          value={_id}
          onChange={(e) => setId(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.button}>Get User Info</button>
      </form>
    </div>
{/* JSON Data Display */}
      {jsonData && (
        <div style={{ marginTop: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{color:"black"} }>JSON Response Data</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' , color: 'black'}}>
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
