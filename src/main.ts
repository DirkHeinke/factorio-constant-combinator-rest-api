import express from "express";
import bodyParser from "body-parser";
import { FactorioConnector } from "./factorio-connector";
import { conf } from "./settings";

const app = express();
const factorio = new FactorioConnector();

app.use(bodyParser.json());

app.get("/cc/:id/signals", async (req, res) => {
  const id = req.params.id;
  const idIsValid = /R[0-9]{2}$/.test(id);
  if (!idIsValid) {
    res.status(400);
    res.send({
      error: "Invalid ID. Must be RXX with X = 0-9",
    });
  }

  const result = await factorio.getConstantCombinatorWithId(id.substring(1));
  res.contentType("json");
  res.send(result);
});

app.post("/cc/:id/signal/:signalSlot", async (req, res) => {
  const id = req.params.id;
  const idIsValid = /R[0-9]{2}$/.test(id);
  if (!idIsValid) {
    res.status(400);
    res.send({
      error: "Invalid ID. Must be RXX with X = 0-9",
    });
  }

  // TODO validate data

  await factorio.setSignalToConstantCombinatorWithId(
    id.substring(1),
    parseInt(req.params.signalSlot),
    req.body.signalType,
    req.body.signalName,
    req.body.signalCount
  );
  res.send("OK");
});

app.delete("/cc/:id/signal/:signalSlot", async (req, res) => {
  const id = req.params.id;
  const idIsValid = /R[0-9]{2}$/.test(id);
  if (!idIsValid) {
    res.status(400);
    res.send({
      error: "Invalid ID. Must be RXX with X = 0-9",
    });
  }

  // TODO validate data

  await factorio.deleteSignalToConstantCombinatorWithId(
    id.substring(1),
    parseInt(req.params.signalSlot)
  );
  res.send("OK");
});

app
  .listen(conf.server_port, () => {
    console.log(`Server listening at ${conf.server_port}`);
  })
  .on("error", (err) => console.error(err));
