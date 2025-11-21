const express = require("express");
const path = require("path");
const proxy = require("./proxy");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use("/proxy", proxy);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Servidor iniciado na porta " + port));
