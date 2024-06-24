# Coletivo Bot

## Features

-   Welcome message
-   Ticket system
-   Mini-games
-   Economy system

## Setup your own

### Creating a Discord Bot

-   Go to the [Discord Developer Portal](https://discord.com/developers/applications)
-   Create a new application
-   Go to the bot tab and create a new bot
-   Copy the token and save it for later
-   Go to the OAuth2 tab
    -   Scroll down to the **OAuth2 URL Generator**, and Select the `bot` and `applications.commands` scopes
    -   Scroll down to the **Bot Permissions** and select the permissions you want the bot to have (or select administrator to give all permissions)
    -   Copy the generated URL at the bottom and paste it in your browser
    -   Add the bot to your server

### Running the application

-   install [Node.js](https://nodejs.org/en/) (version 20 or higher)
-   copy the `.env.example` file to `.env` and fill the values
-   run `npm install`
-   run `npm start`
