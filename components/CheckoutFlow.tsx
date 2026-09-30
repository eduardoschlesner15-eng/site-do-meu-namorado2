"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";

const initialOptions = {
    clientId: "test", 
    currency: "BRL",
    intent: "capture",
};

export default function CheckoutFlow({ productName, price }: { productName: string, price: string }) {
  const [step, setStep] = useState<"form" | "payment">("form");
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  if (step === "form") {
    return (
      <div className="mt-6 w-full p-6 border border-neon-green/50 bg-black/80 flex flex-col gap-4 text-left">
        <h4 className="text-xl font-bold neon-text border-b border-neon-green/30 pb-2">DADOS DE ENVIO E NF</h4>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 font-mono text-sm">
          
          <div className="flex flex-col gap-1">
            <label className="text-neon-green">Nome Completo</label>
            <input required name="nome" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-neon-green">CPF/CNPJ</label>
              <input required name="cpf" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-neon-green">Telefone</label>
              <input required name="telefone" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-neon-green">E-mail</label>
            <input type="email" required name="email" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4 border-t border-neon-green/30 pt-4">
            <div className="flex flex-col gap-1 w-1/3">
              <label className="text-neon-green">CEP</label>
              <input required name="cep" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
            </div>
            <div className="flex flex-col gap-1 w-2/3">
              <label className="text-neon-green">Endereço</label>
              <input required name="endereco" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex flex-col gap-1 w-1/3">
              <label className="text-neon-green">Número</label>
              <input required name="numero" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
            </div>
            <div className="flex flex-col gap-1 w-2/3">
              <label className="text-neon-green">Complemento</label>
              <input name="complemento" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-neon-green">Bairro</label>
              <input required name="bairro" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-neon-green">Cidade</label>
              <input required name="cidade" onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green" />
            </div>
            <div className="flex flex-col gap-1 w-1/4">
              <label className="text-neon-green">UF</label>
              <input required name="estado" maxLength={2} onChange={handleInputChange} className="bg-transparent border border-neon-green/50 p-2 text-white focus:outline-none focus:border-neon-green uppercase" />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-4 border border-neon-green bg-neon-green text-black py-3 font-bold text-lg hover:bg-transparent hover:text-neon-green transition-colors"
          >
            PROSSEGUIR PARA PAGAMENTO
          </button>
        </form>
      </div>
    );
  }

  // Final step: Payment
  return (
    <div className="mt-6 w-full p-4 border border-neon-green/50 bg-white/5 flex flex-col gap-4 text-center">
      <h4 className="text-lg font-bold neon-text">PAGAMENTO SEGURO</h4>
      <p className="text-xs font-mono opacity-70 mb-2">Seus dados foram salvos para a emissão da NF-e.</p>
      
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
                  shipping: {
                    name: { full_name: formData.nome },
                    address: {
                      address_line_1: `${formData.endereco}, ${formData.numero}`,
                      address_line_2: formData.complemento,
                      admin_area_2: formData.cidade,
                      admin_area_1: formData.estado,
                      postal_code: formData.cep,
                      country_code: "BR"
                    }
                  }
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            if (actions.order) {
              const details = await actions.order.capture();
              alert(`Sucesso! Pagamento de ${details?.payer?.name?.given_name} confirmado. NF e Código de Rastreio serão enviados para ${formData.email}.`);
            }
          }}
        />
      </PayPalScriptProvider>
      
      <button 
        onClick={() => setStep("form")}
        className="mt-2 text-xs text-neon-green underline"
      >
        Voltar e editar dados
      </button>
    </div>
  );
}
