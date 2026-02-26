'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'sm:max-w-lg',
    showClose = true
}) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className={`relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth}`}>
                                {/* Header */}
                                {(title || showClose) && (
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                        {title && (
                                            <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-900">
                                                {title}
                                            </Dialog.Title>
                                        )}
                                        {showClose && (
                                            <button
                                                type="button"
                                                className="ml-auto rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
                                                onClick={onClose}
                                            >
                                                <span className="sr-only">Close</span>
                                                <X className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Body */}
                                <div className="px-6 py-6">
                                    {children}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
