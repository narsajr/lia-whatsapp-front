# WhatsApp Web Clone - WPPConnect

Uma interface moderna do WhatsApp Web desenvolvida em React com TypeScript, consumindo os serviços do wppconnect-server.

## 🚀 Características

- ✅ Interface moderna e responsiva similar ao WhatsApp Web
- ✅ Tema escuro por padrão
- ✅ Integração completa com wppconnect-server APIs
- ✅ WebSocket para mensagens em tempo real
- ✅ Suporte a múltiplos tipos de mídia (imagem, vídeo, áudio, documentos)
- ✅ Gravação de mensagens de voz
- ✅ Sistema de resposta a mensagens
- ✅ Busca de contatos e conversas
- ✅ Notificações em tempo real
- ✅ TypeScript para maior segurança de tipos

## 🛠️ Tecnologias Utilizadas

- **React 19** com TypeScript
- **Styled Components** para estilização
- **Socket.IO Client** para WebSocket
- **Axios** para requisições HTTP
- **Lucide React** para ícones
- **React Toastify** para notificações
- **Mic Recorder to MP3** para gravação de áudio

## 📋 Pré-requisitos

- Node.js 16+ 
- wppconnect-server rodando na porta 21465

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd wppconnect-web
```

2. Instale as dependências:
```bash
npm install --legacy-peer-deps
```

3. Configure as variáveis de ambiente no arquivo `.env`:
```env
REACT_APP_API_URL=http://localhost:21465/api
REACT_APP_SOCKET_URL=http://localhost:21465
REACT_APP_SECRET_KEY=THISISMYSECURETOKEN
```

4. Inicie o servidor de desenvolvimento:
```bash
npm start
```

5. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🔐 Configuração do WPPConnect Server

Certifique-se de que o wppconnect-server está rodando com as seguintes configurações:

```javascript
// server.js
const server = {
  host: 'localhost',
  port: 21465,
  secretKey: 'THISISMYSECURETOKEN'
};
```

## 📱 Como Usar

1. **Autenticação**: Ao abrir a aplicação pela primeira vez, será exibido um QR Code
2. **Escaneie o QR Code**: Use a câmera do WhatsApp no seu celular para escanear
3. **Aguarde a conexão**: Após escanear, aguarde a sincronização dos dados
4. **Comece a conversar**: Selecione um contato e comece a enviar mensagens

## 🎨 Interface

A interface foi desenvolvida para ser o mais próxima possível do WhatsApp Web oficial, incluindo:

- **Sidebar**: Lista de conversas com busca
- **Chat Area**: Área principal com mensagens
- **Suporte a Mídia**: Visualização de imagens, vídeos, áudios e documentos
- **Mensagens de Voz**: Gravação e reprodução de áudios
- **Respostas**: Sistema de resposta a mensagens específicas

## 📂 Estrutura do Projeto

```
src/
├── components/           # Componentes React
│   ├── ChatArea.tsx     # Área principal do chat
│   ├── ChatList.tsx     # Lista de conversas
│   └── MessageBubble.tsx # Componente de mensagem
├── services/            # Serviços e APIs
│   └── api.ts          # Cliente da API WPPConnect
├── styles/             # Estilos e temas
│   ├── GlobalStyle.ts  # Estilos globais
│   ├── theme.ts        # Definição de temas
│   └── styled.d.ts     # Tipos do styled-components
├── types/              # Definições de tipos TypeScript
│   └── index.ts        # Tipos principais
└── App.tsx             # Componente principal
```

## 🔧 Comandos Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm test` - Executa os testes
- `npm run eject` - Ejeta a configuração do Create React App

## 🌐 APIs Integradas

A aplicação consome todas as principais APIs do wppconnect-server:

- **Autenticação**: Geração de token e gerenciamento de sessão
- **Mensagens**: Envio de texto, mídia e mensagens de voz
- **Contatos**: Listagem e busca de contatos
- **Grupos**: Suporte completo a grupos
- **WebSocket**: Recebimento de mensagens em tempo real

## 🎯 Funcionalidades Implementadas

- [x] Autenticação via QR Code
- [x] Lista de conversas com busca
- [x] Visualização de mensagens
- [x] Envio de mensagens de texto
- [x] Envio de arquivos e imagens
- [x] Gravação e envio de mensagens de voz
- [x] Sistema de resposta a mensagens
- [x] Notificações em tempo real
- [x] Indicadores de status das mensagens
- [x] Suporte a grupos
- [x] Interface responsiva

## 🔮 Próximas Funcionalidades

- [ ] Emoji picker avançado
- [ ] Visualização de status
- [ ] Configurações de perfil
- [ ] Backup e restauração de conversas
- [ ] Tema claro
- [ ] PWA (Progressive Web App)
- [ ] Chamadas de voz e vídeo

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## ⚠️ Disclaimers

- Este projeto é apenas para fins educacionais e de demonstração
- Não é afiliado ao WhatsApp Inc. ou Meta
- Use por sua própria conta e risco
- Respeite os termos de serviço do WhatsApp

## 🙏 Agradecimentos

- [WPPConnect Team](https://github.com/wppconnect-team) pela API fantástica
- Comunidade React e TypeScript
- Contribuidores open source
