import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { SubscriptionPage } from '@/components/subscription/SubscriptionPage';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaywallModal = ({ isOpen, onClose }: PaywallModalProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="mx-auto w-full max-w-6xl bg-white rounded-xl shadow-lg">
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            
            <SubscriptionPage />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PaywallModal; 