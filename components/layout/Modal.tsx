import React from 'react';
import { Button } from '../ui/button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoBack: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onGoBack }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 shadow-lg w-11/12 max-w-md">
                <h2 className="text-lg font-semibold">No change has been made. Are you sure?</h2>
                <div className="mt-4 flex justify-between">
                    <Button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={onGoBack}>
                        Go Back to Inventory
                    </Button>
                    
                    <Button
                        className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                        onClick={onClose}
                    >
                        Retry
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
