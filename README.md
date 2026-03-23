# 🎵 Som & Luz - Aluguel de Equipamentos

Plataforma profissional para gestão e reserva de equipamentos de som e iluminação para eventos.

## 🎯 Propósito
O **Som & Luz** foi desenvolvido para simplificar o processo de aluguel de equipamentos audiovisuais. Ele oferece uma interface intuitiva para clientes explorarem o catálogo e solicitarem reservas, enquanto fornece aos administradores um painel completo para gerenciar o inventário e as solicitações de aluguel.

---

## ✨ O que o projeto tem (Funcionalidades)

### Para Clientes:
- **Catálogo Interativo**: Visualização de equipamentos com fotos, descrições e categorias (Som, Luz, Microfones, Cabos).
- **Sistema de Reservas**: Agendamento de datas com verificação de disponibilidade.
- **Login Social**: Autenticação rápida e segura via Google.
- **Minhas Reservas**: Histórico e status das solicitações do usuário.

### Para Administradores:
- **Painel de Controle**: Gestão completa do inventário (Adicionar, Editar, Remover equipamentos).
- **Gestão de Reservas**: Visualização e controle de todas as solicitações pendentes e aprovadas.
- **Notificações Automáticas**: Integração com Email e Telegram para avisos de novas reservas.

---

## 🛠️ Tecnologias Utilizadas (Tech Stack)

- **Frontend**: React 19, Vite, Tailwind CSS 4.
- **Backend**: Node.js com Express (Proxy para notificações).
- **Banco de Dados & Auth**: Firebase (Firestore e Authentication).
- **Animações**: Framer Motion.
- **Ícones**: Lucide React.
- **Notificações**: Nodemailer (Email) e Telegram Bot API.

---

## 📋 O que você precisa (Pré-requisitos)

Antes de começar, você vai precisar ter instalado em sua máquina:
- [Node.js](https://nodejs.org/en/) (Versão 18 ou superior)
- [NPM](https://www.npmjs.com/)
- Uma conta no [Firebase](https://console.firebase.google.com/)

---

## 🚀 Como rodar o projeto

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/som-e-luz.git
cd som-e-luz
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar o Firebase
Crie um arquivo `firebase-applet-config.json` na raiz do projeto com suas credenciais do Firebase:
```json
{
  "apiKey": "SUA_API_KEY",
  "authDomain": "SEU_PROJETO.firebaseapp.com",
  "projectId": "SEU_PROJETO",
  "storageBucket": "SEU_PROJETO.firebasestorage.app",
  "messagingSenderId": "SEU_SENDER_ID",
  "appId": "SEU_APP_ID",
  "firestoreDatabaseId": "ID_DO_BANCO_DE_DADOS"
}
```

### 4. Variáveis de Ambiente
Crie um arquivo `.env` baseado no `.env.example` e preencha as chaves necessárias:
- `EMAIL_USER` / `EMAIL_PASS`: Para notificações por e-mail.
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`: Para notificações via Telegram.
- `GEMINI_API_KEY`: Para funcionalidades de IA (se aplicável).

### 5. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O projeto estará disponível em `http://localhost:3000`.

---

## 🚢 Deploy

O projeto está configurado para ser facilmente implantado em plataformas como **Vercel**, **Netlify** ou **Cloud Run**. Lembre-se de adicionar os domínios de produção na lista de "Domínios Autorizados" no console do Firebase Authentication.

---

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---
*Desenvolvido com ❤️ para facilitar a vida de quem faz eventos acontecerem.*
