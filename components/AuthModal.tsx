"use client";

import { useState, useEffect, useRef } from "react";
import { 
  formatCPF, 
  isValidCPF, 
  formatPhone, 
  isValidPhone, 
  formatCEP, 
  isValidCEP, 
  isValidEmail, 
  validateEmailStrict,
  fetchAddressByCEP 
} from "@/lib/validation";
import { getSavedUser, saveUser, logoutUser, getOrders, UserProfile, Order } from "@/lib/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: Props) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"cadastro" | "login">("cadastro");
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const [loginEmail, setLoginEmail] = useState("");
  const numeroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSavedUser();
      setUser(current);
      setOrders(getOrders());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formatted = value;

    if (name === "cpf") {
      formatted = formatCPF(value);
      if (formatted.length === 14) {
        if (!isValidCPF(formatted)) {
          setErrors((prev) => ({ ...prev, cpf: "CPF inválido." }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.cpf;
            return next;
          });
        }
      }
    } else if (name === "telefone") {
      formatted = formatPhone(value);
      if (formatted.length >= 14 && isValidPhone(formatted)) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.telefone;
          return next;
        });
      }
    } else if (name === "email") {
      const check = validateEmailStrict(value);
      if (value.length > 3 && !check.isValid) {
        setErrors((prev) => ({ ...prev, email: check.error || "E-mail inválido." }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.email;
          return next;
        });
      }
    } else if (name === "cep") {
      formatted = formatCEP(value);
      const clean = formatted.replace(/\D/g, "");
      if (clean.length === 8) {
        setLoadingCEP(true);
        setCepError("");
        const res = await fetchAddressByCEP(clean);
        setLoadingCEP(false);

        if (res && !res.erro) {
          setFormData((prev) => ({
            ...prev,
            cep: formatted,
            endereco: res.logradouro || prev.endereco,
            bairro: res.bairro || prev.bairro,
            cidade: res.localidade || prev.cidade,
            estado: res.uf || prev.estado,
          }));
          setTimeout(() => numeroInputRef.current?.focus(), 100);
        } else {
          setCepError("CEP não encontrado.");
        }
      }
    }

    setFormData((prev) => ({ ...prev, [name]: formatted }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim() || formData.nome.trim().split(" ").length < 2) {
      newErrors.nome = "Informe nome e sobrenome.";
    }
    const emailCheck = validateEmailStrict(formData.email);
    if (!emailCheck.isValid) {
      newErrors.email = emailCheck.error || "E-mail inválido ou falso.";
    }
    if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido.";
    }
    if (!isValidPhone(formData.telefone)) {
      newErrors.telefone = "Telefone inválido.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const newUser: UserProfile = {
      id: "usr-" + Date.now(),
      nome: formData.nome,
      email: formData.email,
      cpf: formData.cpf,
      telefone: formData.telefone,
      cep: formData.cep,
      endereco: formData.endereco,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
    };

    saveUser(newUser);
    setUser(newUser);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(loginEmail)) {
      alert("Por favor, digite um e-mail válido.");
      return;
    }
    const simulatedUser: UserProfile = {
      id: "usr-" + Date.now(),
      nome: loginEmail.split("@")[0].toUpperCase(),
      email: loginEmail,
      cpf: "123.456.789-00",
      telefone: "(11) 99999-9999",
    };
    saveUser(simulatedUser);
    setUser(simulatedUser);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden rounded-xs border clean-border animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b clean-border bg-[#fafafa]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#cc0000]">Área do Cliente</span>
            <h3 className="text-lg md:text-xl font-black uppercase text-black">
              {user ? `Olá, ${user.nome.split(" ")[0]}` : "Minha Conta"}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold text-gray-500 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 md:p-6 overflow-y-auto">
          {user ? (
            /* USUÁRIO LOGADO */
            <div className="flex flex-col gap-6">
              <div className="bg-gray-50 p-4 border clean-border text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">NOME:</span>
                  <span className="font-bold text-black">{user.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">E-MAIL:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">CPF:</span>
                  <span>{user.cpf}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">TELEFONE:</span>
                  <span>{user.telefone}</span>
                </div>
                {user.cidade && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">ENDEREÇO:</span>
                    <span>{user.endereco}, {user.numero} - {user.cidade}/{user.estado}</span>
                  </div>
                )}
              </div>

              {/* Histórico de Pedidos */}
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider mb-3">Meus Pedidos Recentes</h4>
                {orders.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {orders.slice(0, 3).map((ord) => (
                      <div key={ord.id} className="border clean-border p-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-black block">#{ord.id}</span>
                          <span className="text-gray-500 text-[11px]">{ord.createdAt} • {ord.items[0]?.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-[#cc0000] block">R$ {ord.total.toFixed(2).replace(".", ",")}</span>
                          <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-xs uppercase">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhum pedido realizado ainda.</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full border border-gray-300 py-3 text-xs font-bold uppercase tracking-wider hover:border-black transition-colors cursor-pointer"
                >
                  Sair da Conta
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-black text-white py-3 text-xs font-black uppercase tracking-wider hover:bg-[#cc0000] transition-colors cursor-pointer"
                >
                  Continuar Comprando
                </button>
              </div>
            </div>
          ) : (
            /* USUÁRIO NÃO LOGADO */
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 border-b clean-border pb-3">
                <button
                  onClick={() => setTab("cadastro")}
                  className={`py-2 font-black text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
                    tab === "cadastro" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                  }`}
                >
                  Novo Cadastro
                </button>
                <button
                  onClick={() => setTab("login")}
                  className={`py-2 font-black text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
                    tab === "login" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                  }`}
                >
                  Já tenho conta
                </button>
              </div>

              {tab === "cadastro" ? (
                /* FORMULÁRIO DE CADASTRO COMPLETO */
                <form onSubmit={handleRegister} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-gray-700">Nome Completo *</label>
                    <input 
                      type="text" 
                      name="nome" 
                      required 
                      placeholder="Seu nome completo" 
                      value={formData.nome} 
                      onChange={handleChange}
                      className="border border-gray-300 px-3 py-2 text-xs font-medium outline-none focus:border-black"
                    />
                    {errors.nome && <span className="text-[10px] text-red-600 font-bold">{errors.nome}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase text-gray-700">CPF *</label>
                      <input 
                        type="text" 
                        name="cpf" 
                        maxLength={14} 
                        required 
                        placeholder="000.000.000-00" 
                        value={formData.cpf} 
                        onChange={handleChange}
                        className="border border-gray-300 px-3 py-2 text-xs font-medium outline-none focus:border-black"
                      />
                      {errors.cpf && <span className="text-[10px] text-red-600 font-bold">{errors.cpf}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase text-gray-700">Celular / WhatsApp *</label>
                      <input 
                        type="text" 
                        name="telefone" 
                        maxLength={15} 
                        required 
                        placeholder="(11) 98765-4321" 
                        value={formData.telefone} 
                        onChange={handleChange}
                        className="border border-gray-300 px-3 py-2 text-xs font-medium outline-none focus:border-black"
                      />
                      {errors.telefone && <span className="text-[10px] text-red-600 font-bold">{errors.telefone}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-gray-700">E-mail *</label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      placeholder="seuemail@exemplo.com" 
                      value={formData.email} 
                      onChange={handleChange}
                      className="border border-gray-300 px-3 py-2 text-xs font-medium outline-none focus:border-black"
                    />
                    {errors.email && <span className="text-[10px] text-red-600 font-bold">{errors.email}</span>}
                  </div>

                  {/* ViaCEP */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase text-gray-700 flex justify-between">
                        <span>CEP</span>
                        {loadingCEP && <span className="text-[9px] text-[#cc0000]">...</span>}
                      </label>
                      <input 
                        type="text" 
                        name="cep" 
                        maxLength={9} 
                        placeholder="00000-000" 
                        value={formData.cep} 
                        onChange={handleChange}
                        className="border border-gray-300 px-3 py-2 text-xs font-medium outline-none focus:border-black"
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[11px] font-bold uppercase text-gray-700">Rua / Logradouro</label>
                      <input 
                        type="text" 
                        name="endereco" 
                        placeholder="Rua" 
                        value={formData.endereco} 
                        onChange={handleChange}
                        className="border border-gray-300 px-3 py-2 text-xs font-medium outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase text-gray-700">Número</label>
                      <input 
                        ref={numeroInputRef}
                        type="text" 
                        name="numero" 
                        placeholder="Nº" 
                        value={formData.numero} 
                        onChange={handleChange}
                        className="border border-gray-300 px-3 py-2 text-xs font-medium outline-none focus:border-black"
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[11px] font-bold uppercase text-gray-700">Cidade / UF</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={formData.cidade ? `${formData.cidade} / ${formData.estado}` : ""} 
                        placeholder="Preenchido via CEP" 
                        className="border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 outline-none"
                      />
                    </div>
                  </div>

                  {cepError && <span className="text-[10px] text-amber-700 font-bold">{cepError}</span>}

                  <button 
                    type="submit"
                    className="w-full bg-black text-white py-3.5 font-black text-xs uppercase tracking-wider hover:bg-[#cc0000] transition-colors shadow-sm mt-3 cursor-pointer"
                  >
                    Cadastrar e Salvar Perfil ➔
                  </button>
                </form>
              ) : (
                /* FORMULÁRIO DE LOGIN SIMPLES */
                <form onSubmit={handleLogin} className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-gray-700">Seu E-mail Cadastrado</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="exemplo@gmail.com" 
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-black text-white py-3.5 font-black text-xs uppercase tracking-wider hover:bg-[#cc0000] transition-colors shadow-sm cursor-pointer"
                  >
                    Acessar Conta ➔
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
