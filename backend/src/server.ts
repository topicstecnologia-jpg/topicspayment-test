import { app } from "./app";
import { env } from "./config/env";

const port = Number(process.env.PORT ?? env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`TOPICS Pay API listening on http://localhost:${port}`);
});
