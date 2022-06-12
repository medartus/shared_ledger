import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import './App.css';

import Input from './components/Input';
import TransactionsRecap from './components/TransactionRecap';
import { SharedLedgerWrapper, TransferRequests } from './lib/shared_ledger';

const sharedLedger = new SharedLedgerWrapper();

const App = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const wallet = useAnchorWallet();
  const [initializedProgram, setInitilizedProgram] = useState<boolean>(false);
  const [transferRequets, setTransferRequets] = useState<TransferRequests>();
  const [selectedTransfer, setSelectedTransfer] = useState<PublicKey | null>(
    null
  );

  const [inputValue, setInputValue] = useState({
    topic: '',
    payerWallet: '',
    amount: '',
  });
  const { topic, amount, payerWallet } = inputValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputValue((prev) => ({
      ...prev,
      [name]: value,
    }));
    console.log(inputValue);
  };

  const onCreateTransferRequest = async () => {
    console.log('molo');
    await sharedLedger.createTransferRequest(
      topic,
      parseInt(amount, 10),
      new PublicKey(payerWallet)
    );
  };

  useEffect(() => {
    if (wallet) {
      console.log('wallet config');
      console.log(wallet, connection);
      sharedLedger.initialize(wallet, connection).then(() => {
        console.log('wallet set');
        setInitilizedProgram(true);
      });
    }
  }, [wallet, connection]);

  useEffect(() => {
    if (connected && initializedProgram) {
      sharedLedger.getTransferRequest().then((res) => {
        setTransferRequets(res);
      });
    }
  }, [connected, initializedProgram]);

  const onSelectTransfer = (selectedTransferKey: PublicKey) => {
    setSelectedTransfer(selectedTransferKey);
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
              <h3 className="font-bold">New</h3>
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
            {connected && publicKey ? (
              <form className="mt-3">
                <div className="mb-6">
                  <Input
                    id="topic"
                    inputType="text"
                    label="Reason"
                    name="topic"
                    placeholder="Food and Beverage"
                    value={topic}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-2">
                  <Input
                    id="amount"
                    inputType="number"
                    label="Amount"
                    name="amount"
                    placeholder="2"
                    value={amount}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-6">
                  <Input
                    id="wallet-from"
                    inputType="text"
                    name="payerWallet"
                    label="Payer Wallet"
                    placeholder="Fu2dDKflEWilo52KropRRsu8oJHUQBkDUv7AnaQetC24B"
                    value={payerWallet}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-6">
                  <Input
                    id="wallet-to"
                    inputType="text"
                    name="receiverWallet"
                    label="Receiver Wallet"
                    placeholder={publicKey.toString()}
                    value={publicKey.toString()}
                    onChange={() => {}}
                  />
                </div>
                <div className="flex items-center justify-end">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={!initializedProgram}
                    type="button"
                    onClick={onCreateTransferRequest}
                  >
                    Send Request
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
