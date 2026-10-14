/**
 * Integração Oficial com o Mercado Pago
 */

export const MP_PUBLIC_KEY = "APP_USR-07c121bf-8db5-4fc4-8843-05c96b62444b";
export const MP_ACCESS_TOKEN = "APP_USR-6976511609797770-101318-e168ca97a85b69a65c4bc1f3273f6edf-3759904261";

export type PreferenceData = {
  title: string;
  price: number;
  quantity?: number;
  productSlug?: string;
  onlyPix?: boolean;
  payer: {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    cep: string;
    endereco: string;
    numero: string;
    cidade: string;
    estado: string;
  };
};

export async function createMercadoPagoPreference(data: PreferenceData): Promise<{ init_point: string } | null> {
  try {
    const currentBaseUrl = typeof window !== "undefined" && window.location.origin 
      ? window.location.origin 
      : "https://site-do-meu-nnamnorado.web.app";
    const slug = data.productSlug || "cigarreira-corta-tapa";

    let cleanPhone = data.payer.telefone.replace(/\D/g, "");
    if (cleanPhone.startsWith("55") && (cleanPhone.length === 12 || cleanPhone.length === 13)) {
      cleanPhone = cleanPhone.slice(2);
    }
    const areaCode = cleanPhone.length >= 10 ? cleanPhone.slice(0, 2) : "55";
    const phoneNumber = cleanPhone.length >= 10 ? cleanPhone.slice(2) : cleanPhone;

    const nameParts = data.payer.nome.trim().split(" ");
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "Comprador";

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: data.title,
            quantity: data.quantity || 1,
            unit_price: parseFloat(data.price.toFixed(2)),
            currency_id: "BRL",
          },
        ],
        payer: {
          name: firstName,
          surname: lastName,
          email: data.payer.email,
          phone: {
            area_code: areaCode,
            number: phoneNumber,
          },
          identification: {
            type: "CPF",
            number: data.payer.cpf.replace(/\D/g, ""),
          },
          address: {
            zip_code: data.payer.cep.replace(/\D/g, ""),
            street_name: data.payer.endereco,
            street_number: parseInt(data.payer.numero.replace(/\D/g, "") || "0", 10),
          },
        },
        shipments: {
          receiver_address: {
            zip_code: data.payer.cep.replace(/\D/g, ""),
            street_name: data.payer.endereco,
            street_number: parseInt(data.payer.numero.replace(/\D/g, "") || "0", 10),
            city_name: data.payer.cidade,
            state_name: data.payer.estado,
          },
        },
        payment_methods: data.onlyPix
          ? {
              excluded_payment_types: [
                { id: "ticket" },
                { id: "credit_card" },
                { id: "debit_card" },
              ],
            }
          : {
              excluded_payment_types: [{ id: "ticket" }],
            },
        back_urls: {
          success: `${currentBaseUrl}/checkout/${slug}?status=approved`,
          failure: `${currentBaseUrl}/checkout/${slug}?status=failure`,
          pending: `${currentBaseUrl}/checkout/${slug}?status=pending`,
        },
        auto_return: "approved",
      }),
    });

    if (!response.ok) {
      console.error("Erro ao gerar preferência Mercado Pago:", await response.text());
      return null;
    }

    const json = await response.json();
    return {
      init_point: json.init_point || json.sandbox_init_point,
    };
  } catch (err) {
    console.error("Erro na requisição Mercado Pago:", err);
    return null;
  }
}
