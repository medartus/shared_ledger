import { PublicKey } from '@solana/web3.js';
import moment from 'moment';
import React, { FC } from 'react';
import {
  EventType,
  parseEvents,
  SharedLedgerWrapper,
  TransactionEventParsed,
  TransferAccount,
} from '../lib/shared_ledger';
import TransactionProgress from './TransactionProgress';

const eventString = (eventType: EventType) => {
  switch (eventType) {
    case EventType.CREATION:
      return 'Transfer creation:';
    case EventType.CANCEL:
      return 'Transfer cancelation:';
    case EventType.TRANSFER:
      return 'Transfer payed:';
    default:
      return 'Status: Pending Payer Transfer...';
  }
};

type TransactionsEventRecapProps = {
  event: TransactionEventParsed;
};

const TransactionsEventRecap: FC<TransactionsEventRecapProps> = ({ event }) => {
  const { date, eventType } = event;

  const formatedDate = moment(date).format('HH:mm - MMMM Do YYYY');

  if (eventType === EventType.UNDEFINED) return <></>;

  return (
    <li className="flex flex-row flex justify-between">
      <p>{eventString(eventType)}</p>
      <p>{formatedDate}</p>
    </li>
  );
};

type TransactionInfoProps = {
  leftInfo: string;
  rightInfo: string;
};

const TransactionInfo: FC<TransactionInfoProps> = ({ leftInfo, rightInfo }) => (
  <li className="flex flex-row flex justify-between">
    <p>{leftInfo}</p>
    <p>{rightInfo}</p>
  </li>
);

type TransactionActionsProps = {
  finalEvent: TransactionEventParsed;
  isPayer: boolean;
  onCloseViewer: () => void;
  onProcessTransfer: () => void;
  onCancelTransfer: () => void;
};

const TransactionActions: FC<TransactionActionsProps> = ({
  finalEvent,
  isPayer,
  onCloseViewer,
  onProcessTransfer,
  onCancelTransfer,
}) => {
  if (finalEvent.eventType !== EventType.UNDEFINED) {
    return (
      <button type="button" onClick={onCloseViewer}>
        Close
      </button>
    );
  }
  if (isPayer) {
    return (
      <button type="submit" onClick={onProcessTransfer}>
        Pay
      </button>
    );
  }
  return (
    <button type="submit" onClick={onCancelTransfer}>
      Cancel
    </button>
  );
};

type TransactionsViewerProps = {
  sharedLedgerWrapper: SharedLedgerWrapper;
  transfer: TransferAccount;
  userPubKey: PublicKey;
  onCloseViewer: () => void;
};

const TransactionsViewer: FC<TransactionsViewerProps> = ({
  sharedLedgerWrapper,
  transfer,
  userPubKey,
  onCloseViewer,
}) => {
  const { events, from, to, amount, topic } = transfer;
  const parsedEvents = parseEvents(events);
  const isPayer = userPubKey.equals(transfer.from);

  return (
    <>
      <h3>{topic}</h3>
      <ul>
        <TransactionInfo leftInfo="Payer:" rightInfo={from.toString()} />
        <TransactionInfo leftInfo="Receiver:" rightInfo={to.toString()} />
        <TransactionInfo
          leftInfo="Amount:"
          rightInfo={`${amount.toNumber()} ◎`}
        />
      </ul>
      <TransactionProgress events={parsedEvents} />
      <p>History:</p>
      <ul>
        {parsedEvents.map((event) => (
          <TransactionsEventRecap
            key={event.date.toDateString()}
            event={event}
          />
        ))}
      </ul>
      <TransactionActions
        finalEvent={parsedEvents[1]}
        isPayer={isPayer}
        onCloseViewer={onCloseViewer}
        onCancelTransfer={() =>
          sharedLedgerWrapper.cancelTransferRequest(transfer)
        }
        onProcessTransfer={() =>
          sharedLedgerWrapper.executeTransferRequest(transfer)
        }
      />
    </>
  );
};

export default TransactionsViewer;
