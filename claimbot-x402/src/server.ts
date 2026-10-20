import app from "./app.js";
const port = Number(process.env.PORT || "4021");
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
app.listen(port, () => console.log(`ClaimBot x402 listening on ${port}`));
