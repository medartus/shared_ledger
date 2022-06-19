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

import { PublicKey } from '@solana/web3.js';
import TransactionsRecap from './components/TransactionRecap';
import { SharedLedgerWrapper, Transfer } from './lib/shared_ledger';
import TransactionsCreation from './components/TransactionCreation';
import TransactionsViewer from './components/TransactionViewer';
import { walletExists } from './lib/api';
import CredentialModal from './modals/CredentialsModal';
import Button from './components/Button';
import TransactionSummary from './components/TransactionSummary';

const sharedLedgerWrapper = new SharedLedgerWrapper();

const isPathEqual = (path: string) => window.location.pathname === `/${path}`;
const getParam = (param: string) =>
  new URLSearchParams(window.location.search).get(param);

const App = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const wallet = useAnchorWallet();
  const [initializedProgram, setInitilizedProgram] = useState<boolean>(false);
  const [alreadyRenderedTransfers, setAlreadyRenderedTransfers] =
    useState<boolean>(false);
  const [isKnownUser, setIsKnowUser] = useState<boolean | undefined>(undefined);
  const [transferRequets, setTransferRequets] = useState<Transfer[]>();
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null
  );

  const [isCreationModalVisible, setIsCreationModalVisible] = useState<boolean>(
    isPathEqual('create')
  );

  const onUpdateTransfers = () =>
    sharedLedgerWrapper.getTransferRequest().then(setTransferRequets);

  const openParamTransfer = () => {
    const paramTransferValue = getParam('uuid');
    if (paramTransferValue && isPathEqual('transfer')) {
      const paramUuid = new PublicKey(paramTransferValue);
      transferRequets?.every((transfer) => {
        if (transfer.account.uuid.equals(paramUuid)) {
          return setSelectedTransfer(transfer);
        }
        return true;
      });
    }
  };

  useEffect(() => {
    if (wallet) {
      sharedLedgerWrapper.initialize(wallet, connection).then(() => {
        setInitilizedProgram(true);
      });
    } else {
      setInitilizedProgram(false);
    }
  }, [wallet, connection]);

  useEffect(() => {
    if (publicKey) {
      walletExists(publicKey).then(({ data }) => {
        setIsKnowUser(data.walletExists);
      });
    }
  }, [publicKey]);

  useEffect(() => {
    if (initializedProgram) {
      onUpdateTransfers();
    } else {
      setTransferRequets([]);
    }
  }, [initializedProgram]);

  useEffect(() => {
    if (
      !alreadyRenderedTransfers &&
      transferRequets &&
      transferRequets.length > 0
    ) {
      setAlreadyRenderedTransfers(true);
      openParamTransfer();
    }
  }, [transferRequets]);
  const onSelectTransfer = (transfer: Transfer | null) =>
    setSelectedTransfer(transfer);

  const onOpenCreationModal = () => setIsCreationModalVisible(true);
  const onCloseCreationModal = () => setIsCreationModalVisible(false);

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
            <div className="flex p-5 flex-row justify-between items-baseline">
              <h3 className="text-lg font-bold">Transactions</h3>
              <Button onClick={onDisplayCreation}>New</Button>
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
                  isVisible={isCreationModalVisible}
                  onCloseModal={onCloseCreationModal}
                  onUpdateTransfers={onUpdateTransfers}
                />
              ))}
          </div>
          <div className="hidden box-shadow xl:block p-5 flex w-full rounded-3xl min-h-0 m-5 xl:max-w-sm">
            {transferRequets && publicKey && (
              <TransactionSummary
                transfers={transferRequets}
                userPubKey={publicKey}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
