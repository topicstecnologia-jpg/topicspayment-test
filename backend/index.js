const { app } = require("./dist/src/app");

const port = Number(process.env.PORT || 3001);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`TOPICS Pay API listening on http://localhost:${port}`);
  });
}

module.exports = app;
