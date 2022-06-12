import React, { FC } from 'react';
import { EventType, TransactionEventParsed } from '../lib/shared_ledger';
import '../App.css';

const transferStatus = (eventType: EventType) => {
  switch (eventType) {
    case EventType.CANCEL:
      return 'Status: Cancled Transfer Request';
    case EventType.TRANSFER:
      return 'Status: Payed Transfer Request';
    default:
      return 'Status: Pending Payer Transfer...';
  }
};

type TransactionProgressProps = {
  events: TransactionEventParsed[];
};

const TransactionProgress: FC<TransactionProgressProps> = ({ events }) => {
  const finalEvent = events[1];

  return (
    <div>
      <p className="text-base font-semibold">
        {transferStatus(finalEvent.eventType)}
      </p>
      <div className="flex space-x-5">
        <span className="flex-grow h-2 rounded-sm bg-violet-400" />
        {finalEvent.eventType === EventType.UNDEFINED ? (
          <>
            <span className="flex-grow h-2 rounded-sm bg-violet-400 animate-pulse" />
            <span className="flex-grow h-2 rounded-sm bg-gray-300" />
          </>
        ) : (
          <>
            <span className="flex-grow h-2 rounded-sm bg-violet-400" />
            <span className="flex-grow h-2 rounded-sm bg-violet-400" />
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionProgress;
