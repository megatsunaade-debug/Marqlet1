# AdvConnect - TODO

## Fase 1: Schema do Banco de Dados
- [x] Tabela de clientes (clients)
- [x] Tabela de processos trabalhistas (cases)
- [x] Tabela de mensagens/chat (messages)
- [x] Tabela de FAQ trabalhista (faq_items)
- [x] Tabela de atualizações de processos (case_updates)

## Fase 2: Painel do Advogado
- [x] Dashboard com visão geral de clientes e processos
- [x] Lista de clientes com busca e filtros
- [x] Formulário de cadastro de novo cliente
- [x] Formulário de cadastro de novo processo
- [x] Listagem de processos com busca e filtros
- [x] Visualização detalhada de processo com linha do tempo
- [ ] Sistema de notificações de mensagens não lidas

## Fase 3: Portal do Cliente
- [x] Login automático via link único
- [x] Dashboard do cliente com seus processos
- [ ] Visualização detalhada de processo (linha do tempo)
- [ ] Área de documentos do processo
- [ ] Perfil do cliente

## Fase 4: Sistema de Chat
- [x] Chat em tempo real entre advogado e cliente
- [x] Histórico de conversas por processo
- [x] Indicador de mensagens não lidas no dashboard
- [ ] Notificações de novas mensagens
- [ ] Horário de atendimento configurável
- [ ] Resposta automática fora do horário

## Fase 5: FAQ Automatizada
- [x] Base de conhecimento de perguntas trabalhistas
- [ ] Sistema de busca inteligente no FAQ
- [ ] Chatbot com respostas automáticas
- [ ] Painel de gerenciamento de FAQ (advogado)
- [ ] Estatísticas de perguntas mais frequentes

## Fase 6: Ajustes Finais
- [ ] Testes de usabilidade com advogada trabalhista
- [ ] Ajustes de UX baseados no feedback
- [ ] Otimização de performance
- [ ] Documentação básica de uso
- [ ] Preparação para validação com clientes reais

## Bugs Reportados
- [x] Página /cases/new retorna 404 - precisa ser criada
- [x] Página /cases/:id retorna 404 - criar visualização detalhada do processo
- [x] Página /clients/:id retorna 404 - criar visualização de perfil do cliente
- [x] Criar portal do cliente (/portal/:token) para acesso sem senha
- [x] Atualizações do processo não aparecem no portal do cliente - implementar busca e exibição
- [x] Implementar sistema de chat entre advogado e cliente no portal
- [x] Link de mensagens no dashboard aponta para /messages mas deveria ser /chat
- [x] Implementar contagem de mensagens não lidas no dashboard
- [x] Exibir nome do cliente e número do processo na lista de mensagens
- [x] Marcar mensagens como lidas automaticamente quando advogado abre a conversa
- [x] Atualizar logomarca e nome do aplicativo para MARQLET
- [x] Adicionar logo MARQLET visível no cabeçalho do dashboard
- [x] Atualizar cabeçalho da landing page para mostrar MARQLET
- [x] Adicionar funcionalidade para alterar status do processo (finalizar, arquivar, ganho, perdido)
- [x] Botão "Chat com Cliente" não funciona na página de detalhes do processo
- [x] Botão "Chat com Cliente" deve abrir diretamente no chat do processo específico
- [x] Implementar upload e visualização de documentos nos processos
- [x] Criar tabela de honorários (fees) no banco de dados
- [x] Criar tabela de parcelas (installments) no banco de dados
- [x] Implementar API de gestão de honorários e parcelas
- [x] Criar página de gestão financeira no dashboard
- [x] Implementar cadastro de honorários por processo
- [x] Implementar sistema de parcelamento
- [x] Criar visualização de parcelas por cliente
- [x] Adicionar dashboard financeiro com métricas
- [x] Implementar marcação de parcelas como pagas
- [x] Adicionar visualização de parcelas no portal do cliente
- [x] Exibir nome do processo ao invés do ID nas parcelas

## Integração com Diário de Justiça Eletrônico
- [x] Criar tabela de publicações (publications) no banco de dados
- [ ] Implementar integração com API do TJSP
- [ ] Implementar integração com API do TRT-2
- [ ] Implementar integração com API do TRT-15
- [ ] Criar sistema de monitoramento automático (cron job)
- [ ] Registrar publicações automaticamente na timeline do processo
- [ ] Criar notificações para advogado quando houver nova publicação
- [ ] Adicionar visualização de publicações no dashboard
- [ ] Implementar filtros e busca de publicações

## Corrigir Integração DataJud
- [ ] Testar API DataJud diretamente
- [ ] Identificar e corrigir problema na consulta
- [ ] Validar retorno de publicações

## Cadastro Manual de Publicações
- [x] Adicionar API de cadastro manual de publicações
- [x] Criar interface de formulário na página de detalhes
- [x] Implementar validações e feedback
- [x] Testar cadastro e visualização

## Importação de Dados da Planilha
- [x] Analisar estrutura da planilha Excel
- [x] Criar script de importação
- [x] Executar importação no banco de dados
- [x] Validar dados importados

## Corrigir Links dos Clientes
- [ ] Identificar quais links não funcionam
- [ ] Verificar geração de tokens no banco de dados
- [ ] Corrigir problema de validação ou geração
- [ ] Testar todos os links
