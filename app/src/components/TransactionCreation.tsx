import { useWallet } from '@solana/wallet-adapter-react';
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
  const { publicKey } = useWallet();
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

  const isValidInputRequest = (): boolean => {
    if (topic === '') {
      toast.error("Topic can't be empty");
    } else if (amount === '') {
      toast.error("Amount can't be empty");
    } else if (payerWallet === '') {
      toast.error("Payer wallet can't be empty");
    } else if (topic.length > 50) {
      toast.error("Topic can't be more than 50 characters long");
    } else if (parseFloat(amount) > 0) {
      toast.error("Amount can't be negative");
    } else if (publicKey?.toString() !== payerWallet) {
      toast.error("Can't use your wallet as payer");
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const test = new PublicKey(payerWallet);
      } catch (error) {
        toast.error('Payer wallet must be a valib public key');
      }
      return true;
    }
    return false;
  };

  const onCreateTransferRequest = async () => {
    if (isValidInputRequest()) {
      toast
        .promise(
          sharedLedgerWrapper.createTransferRequest(
            topic,
            parseFloat(amount) * LAMPORTS_PER_SOL,
            new PublicKey(payerWallet)
          ),
          {
            pending: 'Pending transfer request creation...',
            success: 'Sucessful transfer request creation',
            error: 'Impossible transfer request creation',
          }
        )
        .then(onValidateRequest);
    }
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
            placeholder="DTGnpyywd9HBouJDaWD2ea5qrPDKmvD3KYCJBnHupset"
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
