nucigenlabs-landingpage

## Développement local

Le frontend (Vite) et l’API (Express) sont deux processus séparés.

- **Une seule commande** (frontend + API) :
  ```bash
  npm run dev:all
  ```
- **Ou deux terminaux** :
  - Terminal 1 : `npm run api:server` → API sur **http://localhost:3001**
  - Terminal 2 : `npm run dev` → app sur **http://localhost:5173** (ou 5174, 5175 si occupés)

Ouvre l’app à l’URL indiquée par Vite (ex. **http://localhost:5175/**) pour que le proxy `/api` → 3001 fonctionne.

Si tu vois *« Erreur 404 / le serveur API ne répond pas ou renvoie une page HTML »*, soit l’API n’est pas lancée (démarre-la avec `npm run api:server` ou utilise `npm run dev:all`), soit tu es sur une autre URL que celle de Vite (vérifie la ligne « Local: » dans le terminal).
