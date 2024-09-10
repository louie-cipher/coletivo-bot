# Coletivo Bot

**Bot do [Coletivo Trans de Gamedevs 🏳️‍⚧️](https://discord.gg/EAuxvAZBKb)**

## Recursos

-   Mensagens de boas-vindas
-   Sistema de ticket por formulário
-   Mini-games com sistema de moedas
-   XP por chat e por voz

## Tecnologias

-   [Node.js](https://nodejs.org/en/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Discord.js](https://discord.js.org/)
-   [TypeORM](https://typeorm.io/)
-   [SQLite](https://www.sqlite.org/index.html)

---

## Desenvolvimento

**Sugestões e contribuições são bem-vindas!**<br>
(e muito necessárias)

### Requisitos:

-   [Node.js](https://nodejs.org/en/)
-   [Git](https://git-scm.com/)

### Para começar a desenvolver, siga os passos abaixo:

-   Clone o repositório com `git clone https://github.com/louie-cipher/coletivo-bot.git`
-   Instale as dependências com `npm install`

#### Executando o bot localmente

-   Crie uma aplicação para testes em [Discord Developer Portal](https://discord.com/developers/applications)
-   Na aba `Bot`, clique em `Add Bot`
-   Na aba `OAuth2`, marque as permissões `applications.commands` e `bot`
-   Em `BOT PERMISSIONS`, marque `Administrator`
-   Utilize a URL gerada para adicionar o bot a um servidor de testes
-   Copie o arquivo `.env.example` para `.env` e preencha as variáveis de ambiente
    -   `BOT_TOKEN` - Token do bot
    -   `GUILD_ID` - ID do servidor de testes
-   Execute o bot com `npm run dev` ou `npm start`
