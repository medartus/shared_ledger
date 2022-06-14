import React, { FC, useRef } from 'react';
import { PublicKey } from '@solana/web3.js';
import moment from 'moment';
import { useWindowWidth } from '@react-hook/window-size';

import {
  EventType,
  parseEvents,
  SharedLedgerWrapper,
  TransactionEventParsed,
  TransferAccount,
} from '../lib/shared_ledger';
import {
  TransactionWrapperModal,
  TransactionWrapperTitle,
} from '../modals/TransactionWrapper';
import TransactionProgress from './TransactionProgress';
import { getWalletString } from '../utils/utils';

const eventString = (eventType: EventType) => {
  switch (eventType) {
    case EventType.CREATION:
      return 'Created:';
    case EventType.CANCEL:
      return 'Canceled:';
    case EventType.TRANSFER:
      return 'Payed:';
    default:
      return '';
  }
};

type TransactionsEventRecapProps = {
  event: TransactionEventParsed;
};

const TransactionsEventRecap: FC<TransactionsEventRecapProps> = ({ event }) => {
  const { date, eventType } = event;

  const formatedDate = moment(date).format('MMMM Do YYYY - HH:mm');

  if (eventType === EventType.UNDEFINED) return <></>;

  return (
    <li className="flex flex-wrap flex-row justify-between">
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
  <li className="flex md:flex-row justify-between">
    <p>{leftInfo}</p>
    <p>{rightInfo}</p>
  </li>
);

type TransactionActionsProps = {
  finalEvent: TransactionEventParsed;
  isPayer: boolean;
  onProcessTransfer: () => void;
  onCancelTransfer: () => void;
};

const TransactionActions: FC<TransactionActionsProps> = ({
  finalEvent,
  isPayer,
  onProcessTransfer,
  onCancelTransfer,
}) => {
  if (finalEvent.eventType === EventType.UNDEFINED) {
    if (isPayer) {
      return (
        <button
          type="button"
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 md:ml-3 md:w-auto md:text-sm"
          onClick={onProcessTransfer}
        >
          Pay
        </button>
      );
    }
    return (
      <button
        type="button"
        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 md:ml-3 md:w-auto md:text-sm"
        onClick={onCancelTransfer}
      >
        Cancel
      </button>
    );
  }
  return <></>;
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

  const windowWidth = useWindowWidth();
  const shortenWallet = windowWidth <= 768;
  const walletChars = 10;

  const onClose = () => {};

  return (
    <TransactionWrapperModal
      isVisible
      initialFocus={useRef(null)}
      onClose={onClose}
    >
      <TransactionWrapperTitle title={topic} />
      <div className="my-2">
        <ul>
          <TransactionInfo
            leftInfo="Payer:"
            rightInfo={getWalletString(from, shortenWallet, walletChars)}
          />
          <TransactionInfo
            leftInfo="Receiver:"
            rightInfo={getWalletString(to, shortenWallet, walletChars)}
          />
          <TransactionInfo
            leftInfo="Amount:"
            rightInfo={`${amount.toNumber()} ◎`}
          />
        </ul>
      </div>

      <div className="py-2">
        <p>Transfer History:</p>
        <ul>
          {parsedEvents.map((event) => (
            <TransactionsEventRecap
              key={event.date.toDateString()}
              event={event}
            />
          ))}
        </ul>
      </div>
      <TransactionProgress events={parsedEvents} />
      <div className="py-3 md:flex md:flex-row-reverse">
        <TransactionActions
          finalEvent={parsedEvents[1]}
          isPayer={isPayer}
          onCancelTransfer={() =>
            sharedLedgerWrapper.cancelTransferRequest(transfer)
          }
          onProcessTransfer={() =>
            sharedLedgerWrapper.executeTransferRequest(transfer)
          }
        />
        <button
          type="button"
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:mt-0 md:ml-3 md:w-auto md:text-sm"
          onClick={onCloseViewer}
        >
          Close
        </button>
      </div>
    </TransactionWrapperModal>
  );
};

export default TransactionsViewer;
