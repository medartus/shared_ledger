import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import './App.css';

import TransactionsRecap from './components/TransactionRecap';
import { SharedLedgerWrapper, Transfer } from './lib/shared_ledger';
import TransactionsCreation from './components/TransactionCreation';
import TransactionsViewer from './components/TransactionViewer';

const sharedLedgerWrapper = new SharedLedgerWrapper();

const App = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const wallet = useAnchorWallet();
  const [initializedProgram, setInitilizedProgram] = useState<boolean>(false);
  const [transferRequets, setTransferRequets] = useState<Transfer[]>();
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null
  );

  useEffect(() => {
    if (wallet) {
      console.log('wallet config');
      console.log(wallet, connection);
      sharedLedgerWrapper.initialize(wallet, connection).then(() => {
        console.log('wallet set');
        setInitilizedProgram(true);
      });
    }
  }, [wallet, connection]);

  useEffect(() => {
    if (connected && initializedProgram) {
      setTransferRequets([]);
      sharedLedgerWrapper
        .getTransferRequest()
        .then((res) => setTransferRequets(res));
    }
  }, [connected, initializedProgram]);

  const onSelectTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
  };

  const onClearViewer = () => {
    setSelectedTransfer(null);
  };

  return (
    <div className="App">
      <div className="flex flex-col items-center h-screen">
        <div className="flex flex-col md:flex-row items-center md:justify-around pt-5 md:w-full">
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-4xl md:text-5xl">Shared Ledger</h1>
            <h2 className="text-xl py-3">A refund has never been easier!</h2>
          </div>
          <div className="p-5 max-w-sm">
            <p className="text-center">
              Just enter the wallet with the amount and we inform your friend of
              the reimbursement request.
            </p>
            <p className="text-center">Everything in one click!</p>
          </div>
          <WalletMultiButton />
        </div>
        <div className="flex grow flex-row w-full">
          <div className="box-shadow md:block flex flex-col flex-grow w-full rounded-t-3xl md:rounded-3xl min-h-screen md:min-h-0 mt-5 md:m-5 md:max-w-md">
            <div className="flex p-5 flex-row justify-between">
              <h3 className="font-bold">Transactions</h3>
              <button
                className="font-bold"
                type="button"
                onClick={onClearViewer}
              >
                New
              </button>
            </div>
            {connected && transferRequets ? (
              <ul className="flex flex-col">
                <TransactionsRecap
                  transfers={transferRequets}
                  selectedTransfer={selectedTransfer}
                  onSelectTransfer={onSelectTransfer}
                />
              </ul>
            ) : null}
          </div>
          <div className="box-shadow hidden md:block p-5 flex flex-grow w-full rounded-t-3xl md:rounded-3xl min-h-screen md:min-h-0 mt-5 md:m-5">
            <h3 className="font-bold">Create Transfer Request</h3>
            {connected && publicKey && initializedProgram ? (
              <>
                {selectedTransfer ? (
                  <TransactionsViewer
                    transfer={selectedTransfer.account}
                    sharedLedgerWrapper={sharedLedgerWrapper}
                    userPubKey={publicKey}
                    onCloseViewer={onClearViewer}
                  />
                ) : (
                  <TransactionsCreation
                    sharedLedgerWrapper={sharedLedgerWrapper}
                    userPubKey={publicKey}
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
