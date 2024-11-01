'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function userTestingPage() {
    const router = useRouter();

    return (
        <h1>Hello</h1>
    );
}
