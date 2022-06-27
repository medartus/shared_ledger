import React, { FC } from 'react';
import { PublicKey } from '@solana/web3.js';

import { Transfer, parseEvents, EventType } from '../lib/shared_ledger';
import { getSolPrice } from '../utils/utils';

const getTransactionAmount = (transfers: Transfer[], userPubKey: PublicKey) => {
  let numTransactionsReceived = 0;
  let amountReceived = 0;
  let numTransactionsPayed = 0;
  let amountPayed = 0;
  let numTransactionsPendingReception = 0;
  let amountPendingReception = 0;
  let numTransactionsPendingPayment = 0;
  let amountPendingPayment = 0;

  transfers.forEach((transfer) => {
    const { events, from, amount } = transfer.account;
    const amountValue = amount.toNumber();
    const parsedEvents = parseEvents(events);
    const isTransactionPayer = userPubKey.equals(from);

    if (parsedEvents[1].eventType === EventType.UNDEFINED) {
      if (isTransactionPayer) {
        numTransactionsPendingPayment += 1;
        amountPendingPayment += amountValue;
      } else {
        numTransactionsPendingReception += 1;
        amountPendingReception += amountValue;
      }
    } else if (parsedEvents[1].eventType === EventType.TRANSFER) {
      if (isTransactionPayer) {
        numTransactionsPayed += 1;
        amountPayed += amountValue;
      } else {
        numTransactionsReceived += 1;
        amountReceived += amountValue;
      }
    }
  });
  return {
    numTransactionsReceived,
    amountReceived,
    numTransactionsPayed,
    amountPayed,
    numTransactionsPendingReception,
    amountPendingReception,
    numTransactionsPendingPayment,
    amountPendingPayment,
  };
};

type TransactionSummaryProps = {
  transfers: Transfer[];
  userPubKey: PublicKey;
};

const TransactionSummary: FC<TransactionSummaryProps> = ({
  transfers,
  userPubKey,
}) => {
  const {
    numTransactionsReceived,
    amountReceived,
    numTransactionsPayed,
    amountPayed,
    numTransactionsPendingReception,
    amountPendingReception,
    numTransactionsPendingPayment,
    amountPendingPayment,
  } = getTransactionAmount(transfers, userPubKey);
  return (
    <div className="flex flex-col space-y-3">
      <h3 className="text-lg leading-6 font-bold">Transactions Statistics</h3>
      <div>
        <p>Number Transactions Received:</p>
        <p>{numTransactionsReceived}</p>
      </div>
      <div>
        <p>Amount Received:</p>
        <p>{`${getSolPrice(amountReceived)} ◎`}</p>
      </div>
      <div>
        <p>Number Transactions Payed:</p>
        <p>{numTransactionsPayed}</p>
      </div>
      <div>
        <p>Amount Payed:</p>
        <p>{`${getSolPrice(amountPayed)} ◎`}</p>
      </div>
      <div>
        <p>Number Transactions Pending Reception:</p>
        <p>{numTransactionsPendingReception}</p>
      </div>
      <div>
        <p>Amount Pending Reception:</p>
        <p>{`${getSolPrice(amountPendingReception)} ◎`}</p>
      </div>
      <div>
        <p>Number Transactions Pending Payment:</p>
        <p>{numTransactionsPendingPayment}</p>
      </div>
      <div>
        <p>Amount Pending Payment:</p>
        <p>{`${getSolPrice(amountPendingPayment)} ◎`}</p>
      </div>
    </div>
  );
};

export default TransactionSummary;
