import express from "express";
import bodyParser from "body-parser";
import { conf } from "./settings";
import * as CcController from "./constant-combinator-controller";
const app = express();

app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/cc/:id/signals", (req, res) => {
  CcController.getSignals(req, res).catch((err) => {
    res.status(500);
    res.send(err);
  });
});
app.post("/cc/:id/signal/:signalSlot", (req, res) => {
  CcController.setSignalSlot(req, res).catch((err) => {
    res.status(500);
    res.send(err);
  });
});
app.delete("/cc/:id/signal/:signalSlot", (req, res) => {
  CcController.deleteSignalSlot(req, res).catch((err) => {
    res.status(500);
    res.send(err);
  });
});

app
  .listen(conf.server_port, () => {
    console.log(`Server listening at ${conf.server_port}`);
  })
  .on("error", (err) => console.error(err));
