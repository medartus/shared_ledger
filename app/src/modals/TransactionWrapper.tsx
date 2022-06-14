import React, { FC } from 'react';
import { Dialog } from '@headlessui/react';
import { useWindowWidth } from '@react-hook/window-size';

import ModalWrapper from './ModalWrapper';

type TransactionWrapperTitleProps = {
  title: string;
};

export const TransactionWrapperTitle: FC<TransactionWrapperTitleProps> = ({
  title,
}) => {
  const windowWidth = useWindowWidth();

  return (
    <>
      {windowWidth <= 768 ? (
        <div className="mt-3 mb-5 text-center">
          <Dialog.Title
            as="h3"
            className="text-lg leading-6 font-bold text-gray-900"
          >
            {title}
          </Dialog.Title>
        </div>
      ) : (
        <h3>{title}</h3>
      )}
    </>
  );
};

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
}) => {
  const windowWidth = useWindowWidth();
  console.log(windowWidth);
  return (
    <>
      {windowWidth <= 768 ? (
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
};
