import { env } from "./config/env.js";
import { app } from "./app.js";

app.listen(env.PORT, () => {
  console.log(`SafetyApp API listening on :${env.PORT}`);
});
