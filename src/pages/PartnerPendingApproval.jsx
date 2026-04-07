import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

export default function PartnerPendingApproval({ onLogout }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-9 h-9 text-yellow-300" />
        </div>

        <h1 className="text-3xl font-normal mb-4">Aguardando aprovação</h1>
        <p className="text-gray-400 mb-8">
          Seu cadastro de parceiro foi enviado com sucesso. Agora é preciso aguardar o responsável pelo negócio aprovar seu acesso.
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full py-3 bg-primary/10 border border-primary/30 hover:border-primary/60 hover:bg-primary/20 text-primary rounded-button font-normal uppercase transition-all"
          >
            VOLTAR PARA O INÍCIO
          </Link>
          <button
            type="button"
            onClick={() => onLogout('/parceiro/login')}
            className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-button font-normal uppercase transition-all hover:bg-red-500/20"
          >
            SAIR
          </button>
        </div>
      </div>
    </div>
  );
}
