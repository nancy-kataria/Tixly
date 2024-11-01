'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from "@/styles/Testing.module.css";


export default function userTestingPage() {
    const router = useRouter();

    const [_id, setId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [userType, setUserType] = useState('User');



    const getRequest = async (e) => {

    }
    const putRequest = async (e) => {

    }
    const postRequest = async (e) => {

    }
    
    return (
        <div className={styles['form-container']}>
            <h1>User Testing</h1>
            <div>
                Post/Put
            </div>
            <input
              type="text"
              placeholder="_id"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />


        </div>
    );
}
