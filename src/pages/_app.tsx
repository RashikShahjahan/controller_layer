import type { AppProps } from 'next/app';
import { TRPCProvider } from '../components/TRPCProvider';
import '../styles/ChatbotInterface.css';
// ... rest of your _app.tsx code
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TRPCProvider>
      <Component {...pageProps} />
    </TRPCProvider>
  );
}

export default MyApp;