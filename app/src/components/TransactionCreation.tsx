import { PublicKey } from '@solana/web3.js';
import React, { FC, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { SharedLedgerWrapper } from '../lib/shared_ledger';
import {
  TransactionWrapperModal,
  TransactionWrapperTitle,
} from '../modals/TransactionWrapper';
import Input from './Input';

type TransactionsCreationProps = {
  sharedLedgerWrapper: SharedLedgerWrapper;
  isVisible: boolean;
  onCloseModal: () => void;
  onUpdateTransfers: () => void;
};

const TransactionsCreation: FC<TransactionsCreationProps> = ({
  sharedLedgerWrapper,
  isVisible,
  onCloseModal,
  onUpdateTransfers,
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

  const onValidateRequest = () => {
    onUpdateTransfers();
    onCloseModal();
  };

  const onCreateTransferRequest = async () => {
    toast
      .promise(
        sharedLedgerWrapper.createTransferRequest(
          topic,
          parseInt(amount, 10),
          new PublicKey(payerWallet)
        ),
        {
          pending: 'Pending transfer request creation ...',
          success: 'Sucessful transfer request creation',
          error: 'Impossible transfer request creation',
        }
      )
      .then(onValidateRequest);
  };

  return (
    <TransactionWrapperModal
      isVisible={isVisible}
      initialFocus={useRef(null)}
      onClose={onCloseModal}
    >
      <TransactionWrapperTitle title="Create Transfer Request" />
      <form className="mt-3">
        <div className="my-3 space-y-4">
          <Input
            id="topic"
            inputType="text"
            label="Reason"
            name="topic"
            placeholder="Food and Beverage"
            value={topic}
            onChange={handleChange}
          />
          <Input
            id="amount"
            inputType="number"
            label="Amount"
            name="amount"
            placeholder="2"
            value={amount}
            onChange={handleChange}
          />
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
        <div className="py-3 md:flex md:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 md:ml-3 md:w-auto md:text-sm"
            onClick={onCreateTransferRequest}
          >
            Create
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:mt-0 md:ml-3 md:w-auto md:text-sm md:hidden"
            onClick={onCloseModal}
          >
            Close
          </button>
        </div>
      </form>
    </TransactionWrapperModal>
  );
};

export default TransactionsCreation;
