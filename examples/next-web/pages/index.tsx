import Head from 'next/head';
import type { JSX } from 'react';
import { NavBar } from '../components/NavBar/NavBar';

export default function Home(): JSX.Element {
  return (
    <>
      <Head>
        <title>{process.env.NEXT_PUBLIC_SITE_NAME}</title>
      </Head>
      <div className="flex h-screen flex-col">
        <div className="shrink-0">
          <NavBar current="home" />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <h1 className="text-2xl font-semibold">Welcome to {process.env.NEXT_PUBLIC_SITE_NAME}</h1>
        </div>
      </div>
    </>
  );
}
