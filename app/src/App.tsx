import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ToastContainer } from 'react-toastify';
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import TransactionsRecap from './components/TransactionRecap';
import { SharedLedgerWrapper, Transfer } from './lib/shared_ledger';
import TransactionsCreation from './components/TransactionCreation';
import TransactionsViewer from './components/TransactionViewer';
import { walletExists } from './lib/api';
import CredentialModal from './modals/CredentialsModal';

const sharedLedgerWrapper = new SharedLedgerWrapper();

const App = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const wallet = useAnchorWallet();
  const [initializedProgram, setInitilizedProgram] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isKnownUser, setIsKnowUser] = useState<boolean | undefined>(undefined);
  const [transferRequets, setTransferRequets] = useState<Transfer[]>();
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null
  );

  const onUpdateTransfers = () =>
    sharedLedgerWrapper.getTransferRequest().then(setTransferRequets);

  useEffect(() => {
    if (wallet) {
      sharedLedgerWrapper.initialize(wallet, connection).then(() => {
        setInitilizedProgram(true);
      });
    } else {
      setInitilizedProgram(false);
      setTransferRequets([]);
    }
  }, [wallet, connection]);

  useEffect(() => {
    if (publicKey) {
      walletExists(publicKey).then((res) => {
        setIsKnowUser(res.status === 200);
      });
    }
  }, [publicKey]);

  useEffect(() => {
    if (initializedProgram) {
      setTransferRequets([]);
      onUpdateTransfers();
    }
  }, [initializedProgram]);

  const onSelectTransfer = (transfer: Transfer | null) =>
    setSelectedTransfer(transfer);

  const onOpenCreationModal = () => setIsVisible(true);
  const onCloseCreationModal = () => setIsVisible(false);

  const onDisplayCreation = () => {
    onOpenCreationModal();
    onSelectTransfer(null);
  };

  const onClearViewer = () => {
    onCloseCreationModal();
    onSelectTransfer(null);
  };

  return (
    <div className="App">
      <ToastContainer />
      {isKnownUser !== undefined && (
        <CredentialModal
          sharedLedgerWrapper={sharedLedgerWrapper}
          isKnownUser={isKnownUser}
        />
      )}
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
              <h3 className="text-lg font-bold">Transactions</h3>
              <button
                className="text-lg font-bold"
                type="button"
                onClick={onDisplayCreation}
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
            {connected &&
              publicKey &&
              initializedProgram &&
              (selectedTransfer ? (
                <TransactionsViewer
                  transfer={selectedTransfer.account}
                  sharedLedgerWrapper={sharedLedgerWrapper}
                  userPubKey={publicKey}
                  onCloseViewer={onClearViewer}
                  onUpdateTransfers={onUpdateTransfers}
                />
              ) : (
                <TransactionsCreation
                  sharedLedgerWrapper={sharedLedgerWrapper}
                  isVisible={isVisible}
                  onCloseModal={onCloseCreationModal}
                  onUpdateTransfers={onUpdateTransfers}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
