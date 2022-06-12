import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import moment from 'moment';
import BN from 'bn.js';

import { TransactionEvent, TransferRequests } from '../lib/shared_ledger';

type TransactionBubbleProps = {
  eventType: object;
};

const TransactionBubble: FC<TransactionBubbleProps> = ({ eventType }) => {
  const eventString = Object.keys(eventType)[0];

  console.log(eventString);

  return <div className={`transaction-bubble bubble-${eventString}`} />;
};

type TransferProps = {
  topic: string;
  from: PublicKey;
  to: PublicKey;
  amount: BN;
  events: TransactionEvent[];
  isSelected: boolean;
  onClick: () => void;
};

const Transfer: FC<TransferProps> = ({
  topic,
  from,
  to,
  amount,
  events,
  isSelected,
  onClick,
}) => {
  const { publicKey } = useWallet();
  const isReceiver = to === publicKey;
  const stranegrWallet = (isReceiver ? from : to).toString();
  const stranegrWalletStart = stranegrWallet.substring(0, 6);
  const stranegrWalletEnd = stranegrWallet.substring(stranegrWallet.length - 6);
  const stranegrWalletText = `${stranegrWalletStart}...${stranegrWalletEnd}`;
  const processedTrandsaction =
    Object.keys(events[1].eventType)[0] !== 'undefined';
  const eventToDsiplay = events[processedTrandsaction ? 1 : 0];
  const date = new Date(eventToDsiplay.timestamp.toNumber() * 1000);
  const formatedDate = moment(date).format('MMM Do YYYY');

  const amountText = `${isReceiver ? '+' : '-'}${amount.toNumber()}◎`;

  console.log(isSelected);

  return (
    <li className={`flex ${isSelected ? 'selected-transaction' : ''}`}>
      <button
        className="flex p-3 flex-1 flex-row items-center"
        type="button"
        onClick={onClick}
      >
        <TransactionBubble eventType={eventToDsiplay.eventType} />
        <div className="pl-5 flex flex-1 flex-col">
          <div className="flex flex-row justify-between">
            <p>{topic}</p>
            <p>{amountText}</p>
          </div>
          <div className="flex flex-row justify-between">
            <p>{stranegrWalletText}</p>
            <p>{formatedDate}</p>
          </div>
        </div>
      </button>
    </li>
  );
};

type TransactionsRecapProps = {
  transfers: TransferRequests;
  selectedTransfer: PublicKey | null;
  onSelectTransfer: (selectedTransfer: PublicKey) => void;
};

const TransactionsRecap: FC<TransactionsRecapProps> = ({
  transfers,
  selectedTransfer,
  onSelectTransfer,
}) => (
  <>
    {transfers?.map((transfer) => {
      const { topic, from, to, amount, events } = transfer.account;
      return (
        <Transfer
          key={transfer.publicKey.toString()}
          topic={topic}
          from={from}
          to={to}
          amount={amount}
          events={events as TransactionEvent[]}
          isSelected={selectedTransfer === transfer.publicKey}
          onClick={() => onSelectTransfer(transfer.publicKey)}
        />
      );
    })}
  </>
);

export default TransactionsRecap;
