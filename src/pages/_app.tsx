import "../../styles/globals.css";
import { Header } from '../components/header'
import type { AppProps } from "next/app";

import { Toaster } from 'react-hot-toast'

import { SessionProvider } from "next-auth/react"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#333",
            color: "#FFF",
            boxShadow: "0 2px 5px rgba(0,0,0,0.9)"
          },
          success: {
            style: {
              background: '#16A34A',
              color: "#FFF",
            }
          },
        }}
      />
      <Header />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
