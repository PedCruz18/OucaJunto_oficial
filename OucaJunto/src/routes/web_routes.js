// importa o express
const express = require('express');

// Cria um roteador Express
const router = express.Router();

// exporta uma função que recebe publicDir (arquivos estáticos usam o publicDir)
module.exports = (publicDir) => {

  // responde com o arquivo central.html usando o publicDir recebido
  router.get('/', (req, res) => {
    res.sendFile('central.html', { root: publicDir });
  });

  // retorna o router configurado
  return router;
};