export const ptBR = {
  alerts: {
    action_failed_support: {
      title: 'Algo fugiu do esperado',
      body:
        'Houve uma falha ao concluir este procedimento agora.\n\n' +
        'Isso pode ser uma instabilidade temporária.\n\n' +
        'Caso o problema persista, clique em SUPORTE disponível na faixa amarela para falar conosco.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    session_invalid: {
      title: 'Falha no acesso',
      body: 'Faça login novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    business_not_loaded: {
      title: 'Falha ao ler os dados do negócio',
      body: 'Recarregue a página e tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
  },

  dashboard: {
    logo_updated: {
      title: 'Logo atualizada',
      body: 'Sua logo foi atualizada com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    logo_update_error: {
      title: 'Erro ao atualizar logo',
      body: 'Tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    business_info_updated: {
      title: 'Salvo',
      body: 'Dados do negócio salvos com sucesso',
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
      body: 'Houve um erro ao salvar os dados. Tente novamente.',
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
      body: 'O limite por imagem é 4MB.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    gallery_upload_error: {
      title: 'Erro no upload',
      body: 'Ocorreu uma falha no envio de um arquivo. Tente novamente.',
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
      body: 'Houve um erro ao carregar o arquivo. Tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
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
      body: 'Houve um erro ao remover este arquivo. Tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    service_promo_invalid: {
      title: 'Oferta inválida',
      body: 'O preço de oferta precisa ser menor que o preço normal.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    service_price_invalid: {
      title: 'Preço inválido',
      body: 'Informe um preço válido.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    service_duration_invalid: {
      title: 'Tempo inválido',
      body: 'Informe o tempo em minutos.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    business: {

      tab_title: {
        servicos:  'Serviços',
        consultas: 'Consultas',
        aulas:     'Aulas',
      },

      button_add: {
        servicos:  'SERVIÇO',
        consultas: 'CONSULTA',
        aulas:     'AULA',
      },

      modal_new: {
        servicos:  'NOVO SERVIÇO',
        consultas: 'NOVA CONSULTA',
        aulas:     'NOVA AULA',
      },
      modal_edit: {
        servicos:  'EDITAR SERVIÇO',
        consultas: 'EDITAR CONSULTA',
        aulas:     'EDITAR AULA',
      },

      button_create: {
        servicos:  'CRIAR SERVIÇO',
        consultas: 'CRIAR CONSULTA',
        aulas:     'CRIAR AULA',
      },

      counter_singular: {
        servicos:  'SERVIÇO',
        consultas: 'CONSULTA',
        aulas:     'AULA',
      },
      counter_plural: {
        servicos:  'SERVIÇOS',
        consultas: 'CONSULTAS',
        aulas:     'AULAS',
      },

      empty_list: {
        servicos:  'Sem serviços para este profissional.',
        consultas: 'Sem consultas para este profissional.',
        aulas:     'Sem aulas para este profissional.',
      },

      servicos: {
        service_created: {
          title: 'Serviço criado',
          body: 'O novo serviço já está disponível para agendamento.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        service_updated: {
          title: 'Serviço atualizado',
          body: 'Os ajustes foram salvos com sucesso.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        service_create_error: {
          title: 'Erro ao criar',
          body: 'Ocorreu uma falha ao criar este serviço. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        service_update_error: {
          title: 'Erro ao salvar',
          body: 'Ocorreu uma falha ao atualizar este serviço. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        service_delete_confirm: {
          title: 'Excluir serviço?',
          body: 'Tem certeza que deseja excluir este serviço?',
          variant: 'warning', screen: 'dark',
          confirmText: 'EXCLUIR', cancelText: 'CANCELAR', buttonText: 'EXCLUIR',
        },
        service_deleted: {
          title: 'Serviço excluído',
          body: 'O serviço foi removido da lista.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        service_delete_error: {
          title: 'Erro',
          body: 'Houve um erro ao excluir o serviço. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        service_prof_required: {
          title: 'Selecione um profissional',
          body: 'Escolha um profissional para o serviço.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
      },

      consultas: {
        service_created: {
          title: 'Consulta criada',
          body: 'A nova consulta já está disponível para agendamento.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        service_updated: {
          title: 'Consulta atualizada',
          body: 'Os ajustes foram salvos com sucesso.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        service_create_error: {
          title: 'Erro ao criar',
          body: 'Ocorreu uma falha ao criar esta consulta. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        service_update_error: {
          title: 'Erro ao salvar',
          body: 'Ocorreu uma falha ao atualizar esta consulta. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        service_delete_confirm: {
          title: 'Excluir consulta?',
          body: 'Tem certeza que deseja excluir esta consulta?',
          variant: 'warning', screen: 'dark',
          confirmText: 'EXCLUIR', cancelText: 'CANCELAR', buttonText: 'EXCLUIR',
        },
        service_deleted: {
          title: 'Consulta excluída',
          body: 'A consulta foi removida da lista.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        service_delete_error: {
          title: 'Erro',
          body: 'Houve um erro ao excluir a consulta. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        service_prof_required: {
          title: 'Selecione um profissional',
          body: 'Escolha um profissional para esta consulta.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
      },

      aulas: {
        service_created: {
          title: 'Aula criada',
          body: 'A nova aula já está disponível para agendamento.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        service_updated: {
          title: 'Aula atualizada',
          body: 'Os ajustes foram salvos com sucesso.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        service_create_error: {
          title: 'Erro ao criar',
          body: 'Ocorreu uma falha ao criar esta aula. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        service_update_error: {
          title: 'Erro ao salvar',
          body: 'Ocorreu uma falha ao atualizar esta aula. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        service_delete_confirm: {
          title: 'Excluir aula?',
          body: 'Tem certeza que deseja excluir esta aula?',
          variant: 'warning', screen: 'dark',
          confirmText: 'EXCLUIR', cancelText: 'CANCELAR', buttonText: 'EXCLUIR',
        },
        service_deleted: {
          title: 'Aula excluída',
          body: 'A aula foi removida da lista.',
          variant: 'success', screen: 'light', buttonText: 'OK',
        },
        service_delete_error: {
          title: 'Erro',
          body: 'Houve um erro ao excluir a aula. Tente novamente.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
        service_prof_required: {
          title: 'Selecione um profissional',
          body: 'Escolha um profissional para esta aula.',
          variant: 'danger', screen: 'dark', buttonText: 'OK',
        },
      },
    },

    professional_created: {
      title: 'Profissional criado',
      body: 'O profissional foi adicionado.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    professional_updated: {
      title: 'Profissional atualizado',
      body: 'Os ajustes foram salvos com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    professional_create_error: {
      title: 'Erro',
      body: 'Houve um erro ao criar o profissional. Tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    professional_update_error: {
      title: 'Erro',
      body: 'Houve um erro ao atualizar o profissional. Tente novamente.',
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
      body: 'Houve um erro ao excluir o profissional. Tente novamente',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    professional_missing_active_column: {
      title: 'Ajuste ausente',
      body: 'O campo ativo está indisponível para este perfil. Tente novamente.',
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
      body: 'O profissional foi ativado.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    professional_inactivated: {
      title: 'Inativado',
      body: 'O profissional foi inativado.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    professional_toggle_error: {
      title: 'Erro',
      body: 'Houve um erro ao alterar o status.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    professional_lunch_blocked: {
      title: 'Horário de almoço bloqueado',
      body: 'Há horários futuros que entram em conflito com o novo horário de almoço.\n\nCancele esses horários antes de salvar esta mudança.',
      variant: 'warning',
      screen: 'dark',
      buttonText: 'ENTENDI',
    },
    professional_workday_blocked: {
      title: 'Dia de trabalho bloqueado',
      body: 'Existe um agendamento futuro no dia que você está tentando desativar.\n\nCancele ou reagende esse atendimento antes de remover este dia.',
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
      body: 'Houve um erro ao concluir o atendimento.',
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
      body: 'O agendamento foi cancelado.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    booking_cancel_error: {
      title: 'Erro',
      body: 'Houve um erro ao cancelar o agendamento. Tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    account_email_invalid: {
      title: 'Email inválido',
      body: 'Digite um email válido.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    account_email_update_sent: {
      title: 'Acesso enviado',
      body: 'Revise seu email para validar a troca.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    account_email_update_error: {
      title: 'Erro',
      body: 'Ocorreu uma falha ao trocar o email. Tente novamente.',
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
      body: 'O código digitado diverge da senha. Revise o texto.',
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
      body: 'Houve um erro ao mudar a senha. Tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },

    parceiro_selecione_prof: {
      title: 'Selecione um profissional',
      body: 'Escolha um profissional antes de salvar o e-mail.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    parceiro_email_invalid: {
      title: 'E-mail inválido',
      body: 'Informe um e-mail válido para continuar.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    parceiro_saved: {
      title: 'E-mail salvo',
      body: 'O e-mail do parceiro foi vinculado com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    parceiro_save_error: {
      title: 'Erro ao salvar',
      body: 'Houve um erro ao salvar o e-mail do parceiro. Tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    parceiro_delete_confirm: {
      title: 'Remover parceiro?',
      body: 'Tem certeza que deseja remover o e-mail deste parceiro?',
      variant: 'warning',
      screen: 'dark',
      confirmText: 'REMOVER',
      cancelText: 'CANCELAR',
      buttonText: 'REMOVER',
    },
    parceiro_deleted: {
      title: 'Parceiro removido',
      body: 'O e-mail do parceiro foi removido com sucesso.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    parceiro_delete_error: {
      title: 'Erro ao remover',
      body: 'Houve um erro ao remover o e-mail do parceiro. Tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    parceiro_acao_proibida: {
      title: 'Ação não permitida',
      body: 'Você só pode gerenciar itens referentes a você.',
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
      body: 'Não foi possível aprovar o parceiro. Tente novamente.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
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
      body: 'A imagem excede o limite permitido.',
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
      body: 'Houve um erro ao alterar sua foto. Tente novamente em breve.',
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
      body: 'Ocorreu uma falha ao salvar seu nome. Tente novamente.',
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
      body: 'Veja seu email para validar o ajuste.',
      variant: 'success',
      screen: 'light',
      buttonText: 'OK',
    },
    account_email_update_error: {
      title: 'Erro ao alterar email',
      body: 'Houve um erro ao alterar seu email. Tente novamente.',
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
      body: 'Ocorreu erro ao mudar sua senha. Tente em alguns instantes.',
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
      body: 'Seu agendamento foi cancelado.',
      variant: 'danger',
      screen: 'dark',
      buttonText: 'OK',
    },
    booking_cancel_error: {
      title: 'Erro ao cancelar',
      body: 'Ocorreu um erro ao concluir o cancelamento. Tente novamente.',
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
      body: 'Houve um erro ao remover o favorito. Tente novamente.',
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
        'Houve um erro ao criar o negócio. Tente novamente em alguns instantes.\n\n' +
        'Tente novamente.\n\n' +
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
        'Houve um erro ao concluir o cadastro do profissional.\n\n' +
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

    load_timeout: 'Demorou demais para carregar. Tente novamente.',
    load_error: 'Erro ao carregar a vitrine.',

    favorite_need_login: {
      title: 'Login necessário',
      body: 'Faça login para favoritar.',
      buttonText: 'ENTENDI',
    },
    favorite_only_client: {
      title: 'Acesso restrito',
      body: 'Apenas CLIENTE pode favoritar negócios.',
      buttonText: 'ENTENDI',
    },
    favorite_invalid_business: {
      title: 'Negócio inválido',
      body: 'Negócio inválido.',
      buttonText: 'ENTENDI',
    },
    favorite_toggle_error: {
      title: 'Erro',
      body: 'Erro ao favoritar. Tente novamente.',
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
      body: 'Você está logado como PROFISSIONAL. Para agendar, entre como CLIENTE.',
      buttonText: 'ENTENDI',
    },

    business: {

      label_button: {
        servicos:  'AGENDAR SERVIÇO',
        consultas: 'AGENDAR CONSULTA',
        aulas:     'AGENDAR AULA',
      },

      section_title: {
        servicos:  'Serviços',
        consultas: 'Consultas',
        aulas:     'Aulas',
      },

      counter_singular: {
        servicos:  'serviço',
        consultas: 'consulta',
        aulas:     'aula',
      },

      counter_plural: {
        servicos:  'serviços',
        consultas: 'consultas',
        aulas:     'aulas',
      },

      empty_list: {
        servicos:  'Sem serviços para este profissional.',
        consultas: 'Sem consultas para este profissional.',
        aulas:     'Sem aulas para este profissional.',
      },
    },

    review_need_login_confirm: {
      title: 'Login necessário',
      body: 'Você precisa fazer login para deixar um depoimento. Deseja fazer login agora?',
      confirmText: 'IR PARA LOGIN',
      cancelText: 'TALVEZ DEPOIS',
    },
    review_only_client: {
      title: 'Acesso restrito',
      body: 'Apenas CLIENTE pode deixar depoimentos.',
      buttonText: 'ENTENDI',
    },
    review_invalid_business: {
      title: 'Negócio inválido',
      body: 'Negócio inválido.',
      buttonText: 'ENTENDI',
    },
    review_sent: {
      title: 'Depoimento registrado',
      body: 'Seu depoimento foi entregue com sucesso.',
      buttonText: 'OK',
    },
    review_send_error_title: 'Erro ao enviar depoimento',
    review_send_error_body: 'Houve falha ao entregar seu depoimento:',
  },
};
