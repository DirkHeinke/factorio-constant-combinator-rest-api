import express from "express";
import bodyParser from "body-parser";
import { FactorioConnector } from "./factorio-connector";
import { conf } from "./settings";

const app = express();
const factorio = new FactorioConnector();

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

app.get("/cc/:id/signals", async (req, res) => {
  const id = req.params.id;
  const idInt = parseInt(id);
  if (isNaN(idInt) || "" + idInt !== id) {
    res.status(400);
    res.send({
      error: "Invalid ID. Must be a number",
    });
    return;
  }

  const result = await factorio.getSignalsFromConstantCombinatorWithId(idInt);
  if (result.error) {
    res.status(400);
    res.send({
      error: "Error from factorio: " + result.data,
    });
    return;
  }
  res.contentType("json");
  res.send(result.data);
});

app.post("/cc/:id/signal/:signalSlot", async (req, res) => {
  const id = req.params.id;
  const idInt = parseInt(id);
  if (isNaN(idInt) || "" + idInt !== id) {
    res.status(400);
    res.send({
      error: "Invalid ID. Must be a number",
    });
    return;
  }

  const signalSlotValidationResponse = validateSignalSlot(
    req.params.signalSlot
  );
  if (signalSlotValidationResponse.error) {
    res.status(400);
    res.send({
      error: signalSlotValidationResponse.error,
    });
    return;
  }

  const signalType = <unknown>req.body.signalType;
  const signalName = <unknown>req.body.signalName;
  const signalCount = <unknown>req.body.signalCount;

  if (
    typeof signalType != "string" ||
    typeof signalName != "string" ||
    typeof signalCount != "string"
  ) {
    res.status(400);
    res.send({
      error:
        "Body should contain these properties as string { 'signalName': 'iron-plate', 'signalType': 'item', 'signalCount': '1' }",
    });
    return;
  }

  if (!["item", "fluid", "virtual"].includes(signalType)) {
    res.status(400);
    res.send({
      error: "signalType must be 'item', 'fluid', 'virtual'",
    });
    return;
  }

  const signalCountInt = parseInt(signalCount);
  if (isNaN(signalCountInt) || "" + signalCountInt !== signalCount) {
    res.status(400);
    res.send({
      error: "Invalid signalCount. Must be a number",
    });
    return;
  }

  const result = await factorio.setSignalToConstantCombinatorWithId(
    idInt,
    signalSlotValidationResponse.slot!,
    signalType,
    signalName,
    signalCountInt
  );
  if (result) {
    res.status(400);
    res.send({
      error: "Error from factorio: " + result,
    });
    return;
  }
  res.send();
});

app.delete("/cc/:id/signal/:signalSlot", async (req, res) => {
  const id = req.params.id;
  const idInt = parseInt(id);
  if (isNaN(idInt) || "" + idInt !== id) {
    res.status(400);
    res.send({
      error: "Invalid ID. Must be a number",
    });
    return;
  }

  const signalSlotValidationResponse = validateSignalSlot(
    req.params.signalSlot
  );
  if (signalSlotValidationResponse.error) {
    res.status(400);
    res.send({
      error: signalSlotValidationResponse.error,
    });
    return;
  }

  await factorio.deleteSignalToConstantCombinatorWithId(
    idInt,
    signalSlotValidationResponse.slot!
  );
  res.send();
});

app
  .listen(conf.server_port, () => {
    console.log(`Server listening at ${conf.server_port}`);
  })
  .on("error", (err) => console.error(err));

function validateSignalSlot(slot: string): { error?: string; slot?: number } {
  const slotInt = parseInt(slot);
  if (isNaN(slotInt) || "" + slotInt !== slot) {
    return { error: "Invalid Slot. Must be a number." };
  }

  if (slotInt <= 0 || slotInt > 19) {
    return { error: "Invalid Slot. Slot must be between 1 and 19." };
  }
  return {
    slot: slotInt,
  };
}
