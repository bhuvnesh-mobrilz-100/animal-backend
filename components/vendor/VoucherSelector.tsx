'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface VoucherSelectorProps {
  vendor: any;
  open: boolean;
  onClose: () => void;
}

export function VoucherSelector({ vendor, open, onClose }: VoucherSelectorProps) {
  const [selectedVoucher, setSelectedVoucher] = useState(vendor.vouchers[0]);
  const [quantity, setQuantity] = useState(1);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle purchase
    console.log('Purchase:', { selectedVoucher, quantity, recipientEmail, message });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-xl p-6 z-50"
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Purchase Gift Card</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {vendor.vouchers.map((voucher: any) => (
                  <Button
                    key={voucher.id}
                    type="button"
                    variant={selectedVoucher.id === voucher.id ? 'default' : 'outline'}
                    className="h-auto py-6 relative"
                    onClick={() => setSelectedVoucher(voucher)}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold">R{voucher.value}</div>
                      <div className="text-sm mt-1">{voucher.description}</div>
                    </div>
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total</Label>
                  <div className="h-10 px-3 rounded-md border bg-muted flex items-center">
                    R{selectedVoucher.price * quantity}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Recipients Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter recipients email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Gift Message (Optional)</Label>
                <Input
                  id="message"
                  placeholder="Add a personal message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Purchase Gift Card
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}