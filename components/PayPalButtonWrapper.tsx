"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";

// clientId "test" is a special sandbox key provided by PayPal for development
const initialOptions = {
    clientId: "test", 
    currency: "BRL",
    intent: "capture",
};

export default function PayPalButtonWrapper({ productName, price }: { productName: string, price: string }) {
  const [showPayPal, setShowPayPal] = useState(false);

  if (!showPayPal) {
    return (
      <button 
        onClick={() => setShowPayPal(true)}
        className="w-full mt-6 border-2 border-neon-green py-4 font-bold text-lg hover:bg-neon-green hover:text-black transition-colors shadow-neon"
      >
        COMPRAR COM PAYPAL
      </button>
    );
  }

  return (
    <div className="mt-6 w-full p-2 border border-neon-green/50 bg-white/5">
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons 
          style={{ layout: "vertical", color: "black", shape: "rect", label: "pay" }} 
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  description: productName,
                  amount: {
                    currency_code: "BRL",
                    value: price,
                  },
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            if (actions.order) {
              const details = await actions.order.capture();
              alert("Pagamento concluído com sucesso por " + details?.payer?.name?.given_name);
            }
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
