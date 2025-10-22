# OucaJunto

Aplicação web para streaming de áudio — versão oficial do projeto.

## Rápido início
Requisitos: Node.js (v16+ recomendado) e npm.

Instalar dependências:
```powershell
npm install
```

Rodar em desenvolvimento (reinício automático com nodemon):
```powershell
npm run dev
```

Rodar em produção:
```powershell
npm start
```

## Scripts úteis (package.json)
- `start` — inicia com `node server.js`
- `dev` — inicia com `nodemon` e observa `src/` e `public/`

## Estrutura principal
- server.js — ponto de entrada do servidor
- public/ — arquivos estáticos (ex.: central.html)
- src/routes/ — rotas Express (ex.: web_routes.js)
- static/, utils/ — recursos e utilitários

## Notas
- Use `__dirname` em server.js para montar caminhos absolutos (evita "../../").

## Licença
MIT