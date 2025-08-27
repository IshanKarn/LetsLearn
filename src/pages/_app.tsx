import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) {
  console.log("Rendering _app with session:", session);
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}