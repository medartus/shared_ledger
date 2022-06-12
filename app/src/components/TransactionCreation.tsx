import { PublicKey } from '@solana/web3.js';
import React, { FC, useState } from 'react';
import { SharedLedgerWrapper } from '../lib/shared_ledger';
import Input from './Input';

type TransactionsCreationProps = {
  sharedLedgerWrapper: SharedLedgerWrapper;
  userPubKey: PublicKey;
};

const TransactionsCreation: FC<TransactionsCreationProps> = ({
  sharedLedgerWrapper,
  userPubKey,
}) => {
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
    await sharedLedgerWrapper.createTransferRequest(
      topic,
      parseInt(amount, 10),
      new PublicKey(payerWallet)
    );
  };

  return (
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
          placeholder={userPubKey.toString()}
          value={userPubKey.toString()}
          onChange={() => {}}
        />
      </div>
      <div className="flex items-center justify-end">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={onCreateTransferRequest}
        >
          Send Request
        </button>
      </div>
    </form>
  );
};

export default TransactionsCreation;
