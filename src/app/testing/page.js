"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/styles/Testing.module.css";
import Navbar from "@/components/Navbar";

export default function TestingPage() {
  const router = useRouter();

  return (
    <>
      <Navbar router={router} />
      <div className={styles["form-container"]}>
        <h1 style={{ fontSize: 40 }}>Testing Page</h1>
        <button
          className={styles.button}
          onClick={() => router.push("/testing/Users")}
        >
          User Testing
        </button>
        <div></div>
        <button
          className={styles.button}
          onClick={() => router.push("/testing/Venues")}
        >
          Venues
        </button>
        <div></div>
        <button
          className={styles.button}
          onClick={() => router.push("/testing/Events")}
        >
          Events
        </button>
      </div>
    </>
  );
}
