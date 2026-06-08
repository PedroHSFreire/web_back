require('tsx/cjs');

const appModule = require('./src/app.ts');
const app = appModule.default || appModule;

function start(port = process.env.PORT || 3333) {
  return app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
module.exports.default = app;
module.exports.start = start;
