import React, { useRef, useState, FC } from 'react';
import { Dialog } from '@headlessui/react';
import { InformationCircleIcon } from '@heroicons/react/outline';
import { toast } from 'react-toastify';

import ModalWrapper from './ModalWrapper';
import Input from '../components/Input';
import { SharedLedgerWrapper } from '../lib/shared_ledger';
import Button from '../components/Button';

type CredentialModalProps = {
  sharedLedgerWrapper: SharedLedgerWrapper;
  isKnownUser: boolean;
};

const CredentialModal: FC<CredentialModalProps> = ({
  sharedLedgerWrapper,
  isKnownUser,
}) => {
  const [open, setOpen] = useState(!isKnownUser);

  const cancelButtonRef = useRef(null);

  const [inputValue, setInputValue] = useState({
    email: '',
  });

  const { email } = inputValue;

  const onClose = () => {
    setOpen(false);
  };

  const isValidEmail = () =>
    // eslint-disable-next-line
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    );

  const onSubmitEmail = () => {
    if (isValidEmail()) {
      toast
        .promise(sharedLedgerWrapper.createCredential(email), {
          pending: 'Pending account creation...',
          success: 'Sucessful account creation',
          error: 'Impossible account creation',
        })
        .then(onClose);
    } else {
      toast.error('Invalid email address');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputValue((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <ModalWrapper
      isVisible={open}
      initialFocus={cancelButtonRef}
      onClose={onClose}
    >
      <div className="md:flex md:items-start">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 md:mx-0 md:h-10 md:w-10">
          <InformationCircleIcon
            className="h-6 w-6 text-blue-600"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center md:mt-0 md:ml-4 md:text-left">
          <Dialog.Title as="h3" className="text-lg leading-6 font-bold">
            Configure Your Email
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Share with us your email to notify you when a refund or a request
              is made!
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 ">
        <Input
          id="email"
          inputType="email"
          label=""
          name="email"
          placeholder="john.doe@gmail.com"
          value={email}
          onChange={handleChange}
        />
      </div>
      <div className="py-3 md:flex md:flex-row-reverse">
        <Button onClick={onSubmitEmail} fullwidth color="blue">
          Submit
        </Button>
      </div>
    </ModalWrapper>
  );
};

export default CredentialModal;
