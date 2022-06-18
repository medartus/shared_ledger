import React, { FC, useRef } from 'react';
import { PublicKey } from '@solana/web3.js';
import moment from 'moment';
import { toast } from 'react-toastify';
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
import { getSolPrice, getWalletString } from '../utils/utils';
import Button from './Button';

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
        <Button fullwidth onClick={onProcessTransfer} color="blue">
          Pay
        </Button>
      );
    }
    return (
      <Button fullwidth onClick={onCancelTransfer} color="red">
        Cancel
      </Button>
    );
  }
  return <></>;
};

type TransactionsViewerProps = {
  sharedLedgerWrapper: SharedLedgerWrapper;
  transfer: TransferAccount;
  userPubKey: PublicKey;
  onCloseViewer: () => void;
  onUpdateTransfers: () => void;
};

const TransactionsViewer: FC<TransactionsViewerProps> = ({
  sharedLedgerWrapper,
  transfer,
  userPubKey,
  onCloseViewer,
  onUpdateTransfers,
}) => {
  const { events, from, to, amount, topic } = transfer;
  const parsedEvents = parseEvents(events);
  const isPayer = userPubKey.equals(transfer.from);

  const windowWidth = useWindowWidth();
  const shortenWallet = windowWidth <= 1024;
  const walletChars = 10;

  const onValidateRequest = () => {
    onUpdateTransfers();
    onCloseViewer();
  };

  const onCancelTransfer = () => {
    toast
      .promise(sharedLedgerWrapper.cancelTransferRequest(transfer), {
        pending: 'Pending transfer request cancelation ...',
        success: 'Sucessful transfer request cancelation',
        error: 'Impossible transfer request cancelation',
      })
      .then(onValidateRequest);
  };

  const onProcessTransfer = () => {
    toast
      .promise(sharedLedgerWrapper.executeTransferRequest(transfer), {
        pending: 'Pending transfer request payement ...',
        success: 'Sucessful transfer request payement',
        error: 'Impossible transfer request payement',
      })
      .then(onValidateRequest);
  };

  return (
    <TransactionWrapperModal
      isVisible
      initialFocus={useRef(null)}
      onClose={onCloseViewer}
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
            rightInfo={`${getSolPrice(amount.toNumber(), 2)} ◎`}
          />
        </ul>
      </div>

      <div className="py-2">
        <p>Transfer History:</p>
        <ul>
          {parsedEvents.map((event) => (
            <TransactionsEventRecap
              key={event.date.getTime().toString()}
              event={event}
            />
          ))}
        </ul>
      </div>
      <TransactionProgress events={parsedEvents} />
      <div className="py-3 space-y-3 md:space-y-0 md:flex md:flex-row-reverse">
        <TransactionActions
          finalEvent={parsedEvents[1]}
          isPayer={isPayer}
          onCancelTransfer={onCancelTransfer}
          onProcessTransfer={onProcessTransfer}
        />
        <Button fullwidth onClick={onCloseViewer}>
          Close
        </Button>
      </div>
    </TransactionWrapperModal>
  );
};

export default TransactionsViewer;
