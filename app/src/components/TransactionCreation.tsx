import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import React, { FC, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { SharedLedgerWrapper } from '../lib/shared_ledger';
import {
  TransactionWrapperModal,
  TransactionWrapperTitle,
} from '../modals/TransactionWrapper';
import Button from './Button';
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
          parseFloat(amount) * LAMPORTS_PER_SOL,
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
            label="Amount in SOL"
            name="amount"
            placeholder="2 ◎"
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
        <div className="py-3 space-y-3 md:space-y-0 md:flex md:flex-row-reverse">
          <Button fullwidth color="green" onClick={onCreateTransferRequest}>
            Create
          </Button>
          <div className="md:hidden">
            <Button fullwidth onClick={onCloseModal}>
              Close
            </Button>
          </div>
        </div>
      </form>
    </TransactionWrapperModal>
  );
};

export default TransactionsCreation;
