export const ptBR = {
  alerts: {
    action_failed_support: {
      title: 'Algo fugiu do esperado',
      body:
        'Houve um erro inesperado durante o processamento.\n\n' +
        'Isso pode ser uma instabilidade temporária.\n\n' +
        'Se o problema persistir, clique em SUPORTE na faixa amarela para falar com a gente.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    session_invalid: {
      title: 'Falha no acesso',
      body: 'Por favor, realize o login novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    business_not_loaded: {
      title: 'Falha ao ler os dados do negócio',
      body: 'Ocorreu um erro técnico durante o carregamento dos dados.\n\nRecarregue a página e tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
  },

  dashboard: {
    business_delete_confirm: {
      title: 'Excluir negócio?',
      body:
        'Tem certeza que deseja excluir este negócio?\n\n' +
        'Este comando encerra e apaga os registros do negócio para sempre.',
      variant: 'warning',
      screen: 'dark',
      confirmText: 'EXCLUIR',
      cancelText: 'CANCELAR',
      buttonText: 'EXCLUIR',
    },
    business_deleted: {
      title: 'Negócio excluído',
      body: 'O negócio foi excluído com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    business_delete_error: {
      title: 'Erro ao excluir',
      body: 'Erro ao excluir negócio\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    logo_updated: {
      title: 'Logo atualizada',
      body: 'Sua logo foi atualizada com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    logo_update_error: {
      title: 'Erro ao atualizar logo',
      body: 'Tente atualizar sua logo novamente em instantes.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    business_info_updated: {
      title: 'Salvo',
      body: 'Os dados do negócio foram salvos com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    address_format_invalid: {
      title: 'Endereço inválido',
      body: 'Use o formato: "RUA, NÚMERO - CIDADE, ESTADO".',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    business_info_update_error: {
      title: 'Erro ao salvar',
      body: 'Erro ao salvar os dados do negócio agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    gallery_invalid_format: {
      title: 'Formato inválido',
      body: 'Envie apenas PNG, JPG ou WEBP.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    gallery_too_large: {
      title: 'Arquivo grande',
      body: 'Cada imagem pode ter no máximo 4 MB.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    gallery_upload_error: {
      title: 'Erro no upload',
      body: 'Erro ao enviar uma das imagens.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    gallery_updated: {
      title: 'Galeria atualizada',
      body: 'As imagens foram adicionadas.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    gallery_update_error: {
      title: 'Erro',
      body: 'Erro ao concluir o envio das imagens.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    gallery_load_warning: {
      title: 'Galeria indisponível no momento',
      body:
        'Erro ao carregar as imagens da galeria agora.\n\n' +
        'O restante do painel continua disponível.\n\n' +
        'Tente novamente em instantes.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    gallery_remove_confirm: {
      title: 'Remover imagem?',
      body: 'Tem certeza que deseja remover esta imagem da galeria?',
      variant: 'warning',
      screen: 'dark',
      confirmText: 'REMOVER',
      cancelText: 'CANCELAR',
      buttonText: 'REMOVER',
    },
    gallery_image_removed: {
      title: 'Imagem removida',
      body: 'A imagem foi removida da galeria.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    gallery_remove_error: {
      title: 'Erro',
      body: 'Erro ao remover esta imagem agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    entrega_promo_invalid: {
      title: 'Oferta inválida',
      body: 'O preço de oferta precisa ser menor que o preço normal.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    entrega_price_invalid: {
      title: 'Preço inválido',
      body: 'Informe um valor válido para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    entrega_duration_invalid: {
      title: 'Tempo inválido',
      body: 'Informe o tempo em minutos.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    business: {

      tab_title: {
        servicos:  'SERVS',
        consultas: 'Consultas',
        aulas:     'Aulas',
      },

      button_add: {
        servicos:  'ADD SERV',
        consultas: 'CONSULTA',
        aulas:     'AULA',
      },

      modal_new: {
        servicos:  'NOVO SERV',
        consultas: 'NOVA CONSULTA',
        aulas:     'NOVA AULA',
      },

      modal_edit: {
        servicos:  'EDITAR SERV',
        consultas: 'EDITAR CONSULTA',
        aulas:     'EDITAR AULA',
      },

      counter_singular: {
        servicos:  'SERV',
        consultas: 'CONSULTA',
        aulas:     'AULA',
      },
      counter_plural: {
        servicos:  'SERV',
        consultas: 'CONSULTAS',
        aulas:     'AULAS',
      },

      empty_list: {
        servicos:  'Sem serviços para este profissional.',
        consultas: 'Sem consultas para este profissional.',
        aulas:     'Sem aulas para este profissional.',
      },

      servicos: {
        entrega_created: {
          title: 'Serviço criado',
          body: 'O novo serviço já está disponível para agendamento.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        entrega_updated: {
          title: 'Serviço atualizado',
          body: 'Os ajustes foram salvos com sucesso.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        entrega_create_error: {
          title: 'Erro ao criar',
          body: 'Ocorreu uma falha ao criar este serviço. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        entrega_update_error: {
          title: 'Erro ao salvar',
          body: 'Ocorreu uma falha ao atualizar este serviço. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        entrega_delete_confirm: {
          title: 'Excluir serviço?',
          body: 'Tem certeza que deseja excluir este serviço?',
          variant: 'warning', screen: 'dark',
          confirmText: 'EXCLUIR', cancelText: 'CANCELAR', buttonText: 'EXCLUIR',
        },
        entrega_deleted: {
          title: 'Serviço excluído',
          body: 'O serviço foi removido da lista.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        entrega_delete_error: {
          title: 'Erro',
          body: 'Houve um erro ao excluir o serviço. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        entrega_prof_required: {
          title: 'Selecione um profissional',
          body: 'Escolha um profissional para o serviço.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
      },

      consultas: {
        entrega_created: {
          title: 'Consulta criada',
          body: 'A nova consulta já está disponível para agendamento.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        entrega_updated: {
          title: 'Consulta atualizada',
          body: 'Os ajustes foram salvos com sucesso.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        entrega_create_error: {
          title: 'Erro ao criar',
          body: 'Ocorreu uma falha ao criar esta consulta. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        entrega_update_error: {
          title: 'Erro ao salvar',
          body: 'Ocorreu uma falha ao atualizar esta consulta. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        entrega_delete_confirm: {
          title: 'Excluir consulta?',
          body: 'Tem certeza que deseja excluir esta consulta?',
          variant: 'warning', screen: 'dark',
          confirmText: 'EXCLUIR', cancelText: 'CANCELAR', buttonText: 'EXCLUIR',
        },
        entrega_deleted: {
          title: 'Consulta excluída',
          body: 'A consulta foi removida da lista.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        entrega_delete_error: {
          title: 'Erro',
          body: 'Houve um erro ao excluir a consulta. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        entrega_prof_required: {
          title: 'Selecione um profissional',
          body: 'Escolha um profissional para esta consulta.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
      },

      aulas: {
        entrega_created: {
          title: 'Aula criada',
          body: 'A nova aula já está disponível para agendamento.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        entrega_updated: {
          title: 'Aula atualizada',
          body: 'Os ajustes foram salvos com sucesso.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        entrega_create_error: {
          title: 'Erro ao criar',
          body: 'Ocorreu uma falha ao criar esta aula. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        entrega_update_error: {
          title: 'Erro ao salvar',
          body: 'Ocorreu uma falha ao atualizar esta aula. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        entrega_delete_confirm: {
          title: 'Excluir aula?',
          body: 'Tem certeza que deseja excluir esta aula?',
          variant: 'warning', screen: 'dark',
          confirmText: 'EXCLUIR', cancelText: 'CANCELAR', buttonText: 'EXCLUIR',
        },
        entrega_deleted: {
          title: 'Aula excluída',
          body: 'A aula foi removida da lista.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        entrega_delete_error: {
          title: 'Erro',
          body: 'Houve um erro ao excluir a aula. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        entrega_prof_required: {
          title: 'Selecione um profissional',
          body: 'Escolha um profissional para esta aula.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
      },
    },

    professional_updated: {
      title: 'Profissional atualizado',
      body: 'Os ajustes foram salvos com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    professional_update_error: {
      title: 'Erro',
      body: 'Erro ao atualizar o profissional agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    professional_delete_confirm: {
      title: 'Excluir profissional?',
      body: 'Tem certeza que deseja excluir este profissional?',
      variant: 'warning',
      screen: 'dark',
      confirmText: 'EXCLUIR',
      cancelText: 'CANCELAR',
      buttonText: 'EXCLUIR',
    },
    professional_deleted: {
      title: 'Profissional excluído',
      body: 'O profissional foi removido.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    professional_delete_error: {
      title: 'Erro',
      body: 'Erro ao excluir o profissional agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    professional_inactivate_reason: {
      title: 'Motivo',
      body: 'Se quiser, escreva um motivo (opcional).',
      variant: 'warning',
      screen: 'dark',
      placeholder: 'Ex.: Férias, indisponível...',
      confirmText: 'SALVAR',
      cancelText: 'CANCELAR',
      buttonText: 'SALVAR',
    },
    professional_activated: {
      title: 'Ativado',
      body: 'O profissional foi ativado com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    professional_inactivated: {
      title: 'Inativado',
      body: 'O profissional foi inativado com sucesso.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    professional_toggle_error: {
      title: 'Erro',
      body: 'Erro ao alterar o status agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    professional_almoco_blocked: {
      title: 'Horário de almoço bloqueado',
      body: 'Há horários futuros que entram em conflito com o novo horário de almoço.\n\nCancele esses horários antes de salvar esta mudança.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    professional_dia_blocked: {
      title: 'Dia de trabalho bloqueado',
      body: 'Existe um agendamento futuro no dia que você está tentando desativar.\n\nCancele ou reagende esse atendimento antes de remover este dia.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    professional_schedule_blocked: {
      title: 'Horário de trabalho bloqueado',
      body: 'Há agendamentos futuros fora do novo horário de trabalho que você está tentando salvar.\n\nCancele ou reagende esses atendimentos antes de alterar a abertura ou o fechamento.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },

    booking_confirmed: {
      title: 'Concluído',
      body: 'O atendimento foi concluído.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    booking_confirm_error: {
      title: 'Erro',
      body: 'Erro ao concluir o atendimento agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    booking_cancel_confirm: {
      title: 'Cancelar agendamento?',
      body: 'Tem certeza que deseja cancelar este agendamento?',
      variant: 'warning',
      screen: 'dark',
      confirmText: 'CANCELAR',
      cancelText: 'VOLTAR',
      buttonText: 'CANCELAR',
    },
    booking_canceled: {
      title: 'Agendamento cancelado',
      body: 'O agendamento foi cancelado com sucesso.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    booking_cancel_error: {
      title: 'Erro',
      body: 'Erro ao cancelar o agendamento agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    account_email_invalid: {
      title: 'Email inválido',
      body: 'Digite um email válido para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_email_update_sent: {
      title: 'Acesso enviado',
      body: 'Confira seu email para confirmar a troca.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    account_email_update_error: {
      title: 'Erro',
      body: 'Erro ao solicitar a troca de email agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_password_too_short: {
      title: 'Senha fraca',
      body: 'A senha deve ter no mínimo 6 caracteres.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_password_mismatch: {
      title: 'Senhas diferentes',
      body: 'As senhas digitadas divergem. Revise e tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_password_updated: {
      title: 'Senha atualizada',
      body: 'Sua senha foi alterada com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    account_password_update_error: {
      title: 'Erro',
      body: 'Erro ao alterar a senha agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    parceiro_acao_proibida: {
      title: 'Acesso restrito',
      body: 'Gerencie apenas itens referentes a você.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    professional_approved: {
      title: 'Parceiro aprovado',
      body: 'O acesso do profissional foi liberado com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    partner_approve_error: {
      title: 'Erro ao aprovar',
      body: 'Erro ao aprovar o parceiro agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
  },

  parceiroCadastro: {
    nome_required:        { body: 'Informe seu nome para continuar.', variant: 'erro' },
    email_invalid:        { body: 'Informe um email válido para continuar.', variant: 'erro' },
    senha_too_short:      { body: 'A senha deve ter pelo menos 6 caracteres.', variant: 'erro' },
    slug_required:        { body: 'Informe o slug do negócio para continuar.', variant: 'erro' },
    negocio_not_found:    { body: 'Negócio ausente. Verifique o slug informado e tente novamente.', variant: 'erro' },
    email_already_exists: { body: 'Este email já possui uma conta.\n\nUse a página de login de parceiro.', variant: 'erro' },
    access_unavailable:   { body: 'Erro ao solicitar acesso com este email.\n\nFaça login como parceiro ou fale com o responsável pelo negócio.', variant: 'erro' },
    account_create_error: { body: 'Erro ao criar sua conta agora.\n\nTente novamente.', variant: 'erro' },
    already_pending:      { body: 'Seu cadastro aguarda aval neste negócio.', variant: 'aviso' },
    already_active:       { body: 'Você já está cadastrado neste negócio.\n\nUse a página de login.', variant: 'aviso' },
    access_inactive:      { body: 'Seu acesso está inativo.\n\nEntre em contato com o responsável pelo negócio.', variant: 'erro' },
    unexpected_error:     { body: 'Ocorreu um erro inesperado.\n\nTente novamente.', variant: 'erro' },
    success_title:        'Cadastro enviado',
    success_body:         'Aguarde o aval do responsável pelo negócio para acessar o painel.',
  },

  parceiroLogin: {
    email_invalid:                  { body: 'Informe um email válido para continuar.', variant: 'erro' },
    senha_too_short:                { body: 'A senha deve ter pelo menos 6 caracteres.', variant: 'erro' },
    slug_required:                  { body: 'Informe o slug do negócio para continuar.', variant: 'erro' },
    negocio_not_found:              { body: 'Negócio ausente. Verifique o slug informado e tente novamente.', variant: 'erro' },
    credentials_invalid:            { body: 'Email ou senha incorretos.', variant: 'erro' },
    auth_error:                     { body: 'Erro ao autenticar agora.\n\nTente novamente.', variant: 'erro' },
    not_partner:                    { body: 'Este login pertence a outro tipo de conta para este negócio.', variant: 'erro' },
    pending_approval:               { body: 'Seu acesso ainda aguarda aval do responsável do negócio.', variant: 'aviso' },
    access_inactive:                { body: 'Seu acesso está inativo.\n\nEntre em contato com o responsável pelo negócio.', variant: 'erro' },
    unexpected_error:               { body: 'Ocorreu um erro inesperado.\n\nTente novamente.', variant: 'erro' },
    reset_email_required:           { body: 'Digite seu email antes de solicitar o resgate de senha.', variant: 'aviso' },
    reset_sent:                     { body: 'Link enviado.\n\nConfira sua caixa de entrada para redefinir a senha.', variant: 'sucesso' },
    reset_error:                    { body: 'Erro ao enviar o link agora.\n\nTente novamente.', variant: 'erro' },
    recovery_password_too_short:    { body: 'A nova senha deve ter pelo menos 6 caracteres.', variant: 'erro' },
    recovery_password_mismatch:     { body: 'As senhas divergem. Revise e tente novamente.', variant: 'erro' },
    recovery_password_updated:      { body: 'Senha atualizada com sucesso.\n\nFaça login com a nova senha.', variant: 'sucesso' },
    recovery_password_update_error: { body: 'Erro ao atualizar a senha agora.\n\nTente novamente.', variant: 'erro' },
  },

  clientArea: {
    avatar_invalid_format: {
      title: 'Formato inválido',
      body: 'Use PNG, JPG ou WEBP.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    avatar_too_large: {
      title: 'Imagem muito grande',
      body: 'A imagem excede o limite permitido.\n\nEscolha um arquivo menor e tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    avatar_updated: {
      title: 'Foto atualizada',
      body: 'Sua foto de perfil foi atualizada com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    avatar_update_error: {
      title: 'Erro ao atualizar foto',
      body: 'Erro ao atualizar sua foto agora.\n\nTente novamente em instantes.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    profile_name_required: {
      title: 'Nome obrigatório',
      body: 'Preencha seu nome para salvar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    profile_name_updated: {
      title: 'Nome atualizado',
      body: 'Seu nome foi atualizado com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    profile_name_update_error: {
      title: 'Erro ao salvar nome',
      body: 'Erro ao salvar seu nome agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_email_invalid: {
      title: 'Email inválido',
      body: 'Digite um email válido para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_email_update_sent: {
      title: 'Código de acesso enviado',
      body: 'Confira seu email para validar a troca.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    account_email_update_error: {
      title: 'Erro ao alterar email',
      body: 'Erro ao alterar seu email agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_password_too_short: {
      title: 'Senha muito curta',
      body: 'A senha precisa ter pelo menos 6 caracteres.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_password_mismatch: {
      title: 'Senhas diferentes',
      body: 'As senhas divergem entre si. Revise e tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_password_updated: {
      title: 'Senha atualizada',
      body: 'Sua senha foi atualizada com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    account_password_update_error: {
      title: 'Erro ao alterar senha',
      body: 'Erro ao alterar sua senha agora.\n\nTente novamente em alguns instantes.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    booking_cancel_confirm: {
      title: 'Cancelar agendamento',
      body: 'Tem certeza que deseja cancelar este agendamento?',
      variant: 'warning',
      screen: 'dark',
      confirmText: 'CONFIRMAR',
      cancelText: 'VOLTAR',
      buttonText: 'CONFIRMAR',
    },
    booking_canceled: {
      title: 'Agendamento cancelado',
      body: 'Seu agendamento foi cancelado com sucesso.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    booking_cancel_error: {
      title: 'Erro ao cancelar',
      body: 'Erro ao concluir o cancelamento agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    favorite_removed: {
      title: 'Removido',
      body: 'Favorito removido com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    favorite_remove_error: {
      title: 'Erro ao remover',
      body: 'Erro ao remover o favorito agora.\n\nTente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
  },

  home: {
    search_failed_support: {
      title: 'Houve uma falha ao concluir a busca agora',
      body:
        'Parece que ocorreu uma instabilidade temporária.\n\n' +
        'Tente novamente em alguns segundos.\n\n' +
        'Persistindo a dificuldade, utilize o SUPORTE na faixa amarela para falar com a gente.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
  },

  login: {
    auth_error: {
      title: 'Acesso indisponível no momento.',
      body:
        '{msg}\n\n' +
        'Confira seu email, sua senha e o tipo selecionado.\n\n' +
        'Se o problema persistir, clique em SUPORTE na faixa amarela para falar com a gente.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    reset_email_required: {
      title: 'Informe seu email',
      body:
        'Digite seu email para receber o link de resgate.\n\n' +
        'Se precisar, clique em SUPORTE na faixa amarela.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'OK',
    },
    reset_sent: {
      title: 'Link enviado',
      body:
        'Confira sua caixa de entrada para redefinir a senha.\n\n' +
        'Caso demore, busque o link na pasta de spam.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    reset_error: {
      title: 'Houve um erro ao enviar o link agora.',
      body:
        '{msg}\n\n' +
        'Tente novamente em instantes.\n\n' +
        'Se persistir, clique em SUPORTE na faixa amarela.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    recovery_password_too_short: {
      title: 'Senha muito curta',
      body: 'A nova senha precisa ter pelo menos 6 caracteres.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    recovery_password_mismatch: {
      title: 'Senhas diferentes',
      body: 'O código diverge do esperado. Revise e tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    recovery_password_updated: {
      title: 'Senha atualizada',
      body:
        'Sua senha foi atualizada com sucesso.\n\n' +
        'Agora você pode entrar novamente.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    recovery_password_update_error: {
      title: 'Erro ao atualizar senha',
      body:
        '{msg}\n\n' +
        'Tente novamente.\n\n' +
        'Se persistir, clique em SUPORTE na faixa amarela.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
  },

  signupChoice: {
    navigate_error: {
      title: 'Houve um erro ao avançar. Tente novamente.',
      body:
        'Ocorreu uma falha ao abrir esta fase.\n\n' +
        'Tente novamente em alguns instantes.\n\n' +
        'Persistindo o erro, use o SUPORTE na faixa amarela para falar com a gente.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
  },

  signupClient: {
    name_required: {
      title: 'Nome obrigatório',
      body: 'Informe seu nome para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    email_invalid: {
      title: 'Email inválido',
      body: 'Informe um email válido para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    password_too_short: {
      title: 'Senha muito curta',
      body: 'A senha deve ter no mínimo 6 caracteres.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    created_confirm_email: {
      title: 'Conta criada :)',
      body:
        'Agora confirme seu email para ativar o acesso.\n\n' +
        'Verifique a caixa de entrada e o spam.\n\n' +
        'Depois disso, faça login normalmente.',
      variant: 'success',
      screen: 'light',
      buttonText: 'ENTENDI',
    },
    profile_not_ready: {
      title: 'Quase lá...',
      body:
        'Seu perfil está ausente no sistema.\n\n' +
        'Aguarde alguns segundos e tente fazer login.\n\n' +
        'Se persistir, clique em SUPORTE na faixa amarela.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
  },

  signupProfessional: {
    name_required: {
      title: 'Nome obrigatório',
      body: 'Informe seu nome para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    phone_required: {
      title: 'Telefone obrigatório',
      body: 'Informe seu WhatsApp para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    email_invalid: {
      title: 'Email inválido',
      body: 'Informe um email válido para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    password_too_short: {
      title: 'Senha muito curta',
      body: 'A senha deve ter no mínimo 6 caracteres.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    business_name_required: {
      title: 'Nome do negócio obrigatório',
      body: 'Informe o nome do seu negócio para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    business_slug_invalid: {
      title: 'URL inválida',
      body: 'A URL do negócio precisa ter pelo menos 3 caracteres ou mais, usando apenas letras, números e traços.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    business_type_required: {
      title: 'Tipo de negócio obrigatório',
      body: 'Informe o tipo do seu negócio (ex.: barbearia, clínica...).',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    description_required: {
      title: 'Escreva algo',
      body: 'Conte brevemente sobre seus serviços para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    experience_invalid: {
      title: 'Experiência inválida',
      body: 'Informe um número válido de anos de experiência.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    address_street_required: {
      title: 'Endereço incompleto',
      body: 'Informe a RUA do negócio.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    address_number_required: {
      title: 'Endereço incompleto',
      body: 'Informe o NÚMERO do endereço.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    address_city_required: {
      title: 'Endereço incompleto',
      body: 'Informe a CIDADE.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    address_state_required: {
      title: 'Endereço incompleto',
      body: 'Informe o ESTADO.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    business_slug_taken: {
      title: 'URL já está em uso',
      body: 'Esta URL já está em uso. Escolha outro nome para o negócio.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    confirm_email_needed: {
      title: 'Confirme seu email',
      body:
        'Sua conta foi criada. Confirme seu email para ativar o acesso.\n\n' +
        'Verifique a caixa de entrada e o spam.\n\n' +
        'Depois disso, faça login normalmente.',
      variant: 'success',
      screen: 'light',
      buttonText: 'ENTENDI',
    },
    profile_not_created: {
      title: 'Perfil ausente',
      body:
        'Seu perfil está ausente no sistema.\n\n' +
        'Aguarde alguns segundos e tente fazer login.\n\n' +
        'Se persistir, clique em SUPORTE na faixa amarela.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    profile_wrong_type: {
      title: 'Cadastro inconsistente',
      body:
        'Seu perfil foi criado com tipo incorreto.\n\n' +
        'Clique em SUPORTE na faixa amarela para resolver.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    business_create_error: {
      title: 'Erro ao criar negócio',
      body:
        'Erro ao criar o negócio agora.\n\n' +
        'Tente novamente em alguns instantes.\n\n' +
        'Se persistir, clique em SUPORTE na faixa amarela.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    business_id_missing: {
      title: 'Erro interno',
      body:
        'Seu negócio foi criado; contudo, há uma inconsistência no ID de acesso.\n\n' +
        'Clique em SUPORTE na faixa amarela para resolver.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    professional_create_error: {
      title: 'Erro ao criar profissional',
      body:
        'Erro ao concluir o cadastro do profissional.\n\n' +
        'Tente novamente.\n\n' +
        'Se persistir, clique em SUPORTE na faixa amarela.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
  },

  vitrine: {
    generic_title: 'Aviso',
    common_ok: 'ENTENDI',

    load_timeout: 'A vitrine demorou demais para carregar. Tente novamente.',
    load_error: 'Erro ao carregar a vitrine.',

    favorite_need_login: {
      title: 'Login necessário',
      body: 'Faça login para favoritar este negócio.',
      buttonText: 'ENTENDI',
    },
    favorite_only_client: {
      title: 'Acesso restrito',
      body: 'Apenas contas do tipo CLIENTE podem favoritar negócios.',
      buttonText: 'ENTENDI',
    },
    favorite_invalid_business: {
      title: 'Negócio inválido',
      body: 'Negócio inválido.',
      buttonText: 'ENTENDI',
    },
    favorite_toggle_error: {
      title: 'Erro',
      body: 'Erro ao atualizar o favorito agora.\n\nTente novamente.',
      buttonText: 'OK',
    },
    schedule_need_login_confirm: {
      title: 'Login necessário',
      body: 'Você precisa fazer login para agendar. Deseja fazer login agora?',
      confirmText: 'IR PARA LOGIN',
      cancelText: 'TALVEZ DEPOIS',
    },
    schedule_only_client: {
      title: 'Acesso restrito',
      body: 'Você está logado como PROFISSIONAL.\n\nPara agendar, entre com uma conta CLIENTE.',
      buttonText: 'ENTENDI',
    },

    business: {
      section_title: {
        servicos:  'SERVS',
        consultas: 'Consultas',
        aulas:     'Aulas',
      },
      counter_singular: {
        servicos:  'SERV',
        consultas: 'CONSULTA',
        aulas:     'AULA',
      },
      counter_plural: {
        servicos:  'SERV',
        consultas: 'CONSULTAS',
        aulas:     'AULAS',
      },
      empty_list: {
        servicos:  'Sem serviços para este profissional.',
        consultas: 'Sem consultas para este profissional.',
        aulas:     'Sem aulas para este profissional.',
      },
    },

    depoimento_need_login_confirm: {
      title: 'Login necessário',
      body: 'Você precisa fazer login para deixar um depoimento. Deseja fazer login agora?',
      confirmText: 'IR PARA LOGIN',
      cancelText: 'TALVEZ DEPOIS',
    },
    depoimento_only_client: {
      title: 'Acesso restrito',
      body: 'Apenas contas do tipo CLIENTE podem deixar depoimentos.',
      buttonText: 'ENTENDI',
    },
    depoimento_invalid_business: {
      title: 'Negócio inválido',
      body: 'Negócio inválido.',
      buttonText: 'ENTENDI',
    },
    depoimento_sent: {
      title: 'Depoimento registrado',
      body: 'Seu depoimento foi enviado com sucesso.',
      buttonText: 'OK',
    },
    depoimento_send_error_title: 'Erro ao enviar depoimento',
    depoimento_send_error_body: 'Erro ao enviar seu depoimento:',
  },
};
