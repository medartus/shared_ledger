import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import moment from 'moment';

import {
  EventType,
  parseEvents,
  Transfer,
  TransferAccount,
} from '../lib/shared_ledger';
import { getSolPrice, getWalletString } from '../utils/utils';

type TransactionBubbleProps = {
  eventType: EventType;
};

const TransactionBubble: FC<TransactionBubbleProps> = ({ eventType }) => (
  <div className={`transaction-bubble bubble-${eventType.toString()}`} />
);

type TransferProps = {
  transfer: TransferAccount;
  isSelected: boolean;
  onClick: () => void;
};

const TransferRecap: FC<TransferProps> = ({
  transfer,
  isSelected,
  onClick,
}) => {
  const { from, to, events, amount, topic } = transfer;
  const { publicKey } = useWallet();
  const isReceiver = to === publicKey;
  const strangerWallet = getWalletString(isReceiver ? from : to, true);

  const parsedEvents = parseEvents(events);
  const processedTrandsaction =
    parsedEvents[1].eventType !== EventType.UNDEFINED;
  const eventToDsiplay = parsedEvents[processedTrandsaction ? 1 : 0];
  const formatedDate = moment(eventToDsiplay.date).format('MMM Do YYYY');

  const amountText = `${isReceiver ? '+' : '-'} ${getSolPrice(
    amount.toNumber(),
    2
  )} ◎`;

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
            <p>{strangerWallet}</p>
            <p>{formatedDate}</p>
          </div>
        </div>
      </button>
    </li>
  );
};

type TransactionsRecapProps = {
  transfers: Transfer[];
  selectedTransfer: Transfer | null;
  onSelectTransfer: (selectedTransfer: Transfer) => void;
};

const TransactionsRecap: FC<TransactionsRecapProps> = ({
  transfers,
  selectedTransfer,
  onSelectTransfer,
}) => (
  <>
    {transfers?.map((transfer) => (
      <TransferRecap
        key={transfer.publicKey.toString()}
        transfer={transfer.account as TransferAccount}
        isSelected={selectedTransfer?.publicKey === transfer.publicKey}
        onClick={() => onSelectTransfer(transfer)}
      />
    ))}
  </>
);

export default TransactionsRecap;
