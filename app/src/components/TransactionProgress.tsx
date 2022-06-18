import React, { FC } from 'react';
import { EventType, TransactionEventParsed } from '../lib/shared_ledger';
import '../App.css';

const transferStatus = (eventType: EventType) => {
  switch (eventType) {
    case EventType.CANCEL:
      return 'Canceled Transfer Request';
    case EventType.TRANSFER:
      return 'Payed Transfer Request';
    default:
      return 'Pending Payer Transfer';
  }
};

type TransactionProgressProps = {
  events: TransactionEventParsed[];
};

const TransactionProgress: FC<TransactionProgressProps> = ({ events }) => {
  const finalEvent = events[1];

  return (
    <div className="py-3">
      <li className="flex md:flex-row justify-between">
        <p>Status:</p>
        <p>{transferStatus(finalEvent.eventType)}</p>
      </li>
      <div className="flex space-x-5 mt-2">
        <span className="flex-grow h-2 rounded-sm bg-green-400" />
        {finalEvent.eventType === EventType.UNDEFINED ? (
          <>
            <span className="flex-grow h-2 rounded-sm bg-green-400 animate-pulse" />
            <span className="flex-grow h-2 rounded-sm bg-gray-300" />
          </>
        ) : (
          <>
            <span className="flex-grow h-2 rounded-sm bg-green-400" />
            <span className="flex-grow h-2 rounded-sm bg-green-400" />
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionProgress;
