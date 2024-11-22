import React from 'react';
import logo from './logo.svg';
import './App.css';
import DieRoll from './die-roll/DieRoll';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

function App() {

  const wallets = [new PhantomWalletAdapter()];

  return (
    <div className="App">

      <header className="App-header">
      <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <DieRoll />
      </WalletModalProvider>
      </WalletProvider>
      </header>

      {/*  <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>*/}

    </div>
  );
}

export default App;
