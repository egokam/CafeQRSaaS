// src/components/KitchenReceipt.tsx
import React, { forwardRef } from 'react';

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface KitchenReceiptProps {
  tableNumber: string;
  orderId: string;
  items: OrderItem[];
  time: string;
}

export const KitchenReceipt = forwardRef<HTMLDivElement, KitchenReceiptProps>(
  ({ tableNumber, orderId, items, time }, ref) => {
    return (
      <div className="hidden">

        <div ref={ref} className="w-[80mm] p-4 text-black bg-white font-mono text-sm">
          <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
            <h1 className="text-2xl font-bold uppercase">Next Order</h1>
            <p className="text-lg mt-2">Table: <span className="font-bold text-2xl">{tableNumber}</span></p>
            <p>Order #{orderId}</p>
            <p>{time}</p>
          </div>

          <div className="mb-4">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-start mb-2 border-b border-gray-200 pb-2">
                <div>
                  <p className="font-bold text-lg">{item.quantity}x {item.name}</p>
                  {item.notes && <p className="text-xs italic text-gray-600">- Note: {item.notes}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center border-t-2 border-dashed border-black pt-4">
            <p className="font-bold">*** End of Ticket ***</p>
          </div>
        </div>
      </div>
    );
  }
);

KitchenReceipt.displayName = 'KitchenReceipt';