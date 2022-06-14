import React, { FC } from 'react';
import { Dialog } from '@headlessui/react';
import { useWindowWidth } from '@react-hook/window-size';

import ModalWrapper from './ModalWrapper';

type TransactionWrapperTitleProps = {
  title: string;
};

export const TransactionWrapperTitle: FC<TransactionWrapperTitleProps> = ({
  title,
}) => (
  <>
    {useWindowWidth() <= 768 ? (
      <div className="mt-3 mb-5 text-center">
        <Dialog.Title as="h3" className="text-lg leading-6 font-bold">
          {title}
        </Dialog.Title>
      </div>
    ) : (
      <h3 className="text-lg leading-6 font-bold">{title}</h3>
    )}
  </>
);

type TransactionWrapperModalProps = {
  children: React.ReactNode;
  isVisible: boolean;
  initialFocus: React.MutableRefObject<null>;
  onClose: React.Dispatch<any>;
};

export const TransactionWrapperModal: FC<TransactionWrapperModalProps> = ({
  children,
  isVisible,
  initialFocus,
  onClose,
}) => (
  <>
    {useWindowWidth() <= 768 ? (
      <ModalWrapper
        isVisible={isVisible}
        initialFocus={initialFocus}
        onClose={onClose}
      >
        {children}
      </ModalWrapper>
    ) : (
      <>{children}</>
    )}
  </>
);
