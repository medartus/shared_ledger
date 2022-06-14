import React, { Fragment, FC } from 'react';
import { Dialog, Transition } from '@headlessui/react';

type ModalWrapperProps = {
  children: React.ReactNode;
  isVisible: boolean;
  initialFocus: React.MutableRefObject<null>;
  onClose: React.Dispatch<any>;
};

const ModalWrapper: FC<ModalWrapperProps> = ({
  children,
  isVisible,
  initialFocus,
  onClose,
}) => (
  <Transition.Root show={isVisible} as={Fragment}>
    <Dialog
      as="div"
      className="relative z-10"
      initialFocus={initialFocus}
      onClose={onClose}
    >
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </Transition.Child>

      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-end md:items-center justify-center min-h-full p-4 text-center md:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
            enterTo="opacity-100 translate-y-0 md:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 md:scale-100"
            leaveTo="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
          >
            <Dialog.Panel className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all md:my-8 max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 md:p-6 md:pb-4">
                {children}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition.Root>
);

export default ModalWrapper;
