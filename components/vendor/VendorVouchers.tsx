import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VendorVouchersProps {
  vouchers: Array<{
    id: string;
    value: number;
    price: number;
    description: string;
  }>;
  onSelect: (voucher: any) => void;
}

export function VendorVouchers({ vouchers, onSelect }: VendorVouchersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {vouchers.map((voucher) => (
        <Card key={voucher.id} className="p-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold">R{voucher.value}</h3>
            <p className="text-gray-600 mt-2">{voucher.description}</p>
            <Button 
              className="w-full mt-4"
              onClick={() => onSelect(voucher)}
            >
              Buy Now
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}