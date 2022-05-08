import { Request, Response } from "express";
import { FactorioConnector } from "./factorio-connector";

export async function getSignals(req: Request, res: Response) {
  const id = getIdFromRequest(req, res);
  if (id == null) {
    return;
  }

  const result =
    await FactorioConnector.getCircuitSignalsFromConstantCombinatorWithId(id);
  if (result.error) {
    res.status(400);
    res.send({
      error: "Error from factorio: " + result.data,
    });
    return;
  }

  res.contentType("json");
  res.send(result.data);
}

export async function getSignalSlot(req: Request, res: Response) {
  const id = getIdFromRequest(req, res);
  if (id == null) {
    return;
  }

  const signalSlot = getSignalSlotFromRequest(req, res);
  if (signalSlot == null) {
    return;
  }

  const result = await FactorioConnector.getSignalFromConstantCombinatorWithId(
    id,
    signalSlot
  );

  if (result.error) {
    res.status(400);
    res.send({
      error: "Error from factorio: " + result.data,
    });
    return;
  }

  res.contentType("json");
  res.send(result.data);
}

export async function setSignalSlot(req: Request, res: Response) {
  const id = getIdFromRequest(req, res);
  if (id == null) {
    return;
  }

  const signalSlot = getSignalSlotFromRequest(req, res);
  if (signalSlot == null) {
    return;
  }

  const signalType = getSignalTypeFromRequest(req, res);
  if (signalType == null) {
    return;
  }

  const signalName = getSignalNameFromRequest(req, res);
  if (signalName == null) {
    return;
  }

  const signalCount = getSignalCountFromRequest(req, res);
  if (signalCount == null) {
    return;
  }

  const result = await FactorioConnector.setSignalToConstantCombinatorWithId(
    id,
    signalSlot,
    signalType,
    signalName,
    signalCount
  );
  if (result) {
    res.status(400);
    res.send({
      error: "Error from factorio: " + result,
    });
    return;
  }
  res.send();
}

export async function deleteSignalSlot(req: Request, res: Response) {
  const id = getIdFromRequest(req, res);
  if (id == null) {
    return;
  }

  const signalSlot = getSignalSlotFromRequest(req, res);
  if (signalSlot == null) {
    return;
  }

  await FactorioConnector.deleteSignalToConstantCombinatorWithId(
    id,
    signalSlot
  );
  res.send();
}

function getIdFromRequest(req: Request, res: Response): number | undefined {
  const idString = req.params.id;
  const id = parseInt(idString);
  if (isNaN(id) || id.toString() !== idString) {
    res.status(400);
    res.send({
      error: "Invalid ID. Must be a number",
    });
    return;
  }

  return id;
}

function getSignalSlotFromRequest(
  req: Request,
  res: Response
): number | undefined {
  const signalSlotValidationResponse = validateSignalSlot(
    req.params.signalSlot
  );

  if (signalSlotValidationResponse.error != null) {
    res.status(400);
    res.send({
      error: signalSlotValidationResponse.error,
    });
    return;
  }

  return signalSlotValidationResponse.slot;
}

function getSignalTypeFromRequest(
  req: Request,
  res: Response
): string | undefined {
  const signalType = <unknown>req.body.signalType;

  if (typeof signalType != "string") {
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
      error: "signalType must be 'item', 'fluid' or 'virtual'",
    });
    return;
  }

  return signalType;
}

function getSignalNameFromRequest(
  req: Request,
  res: Response
): string | undefined {
  const signalName = <unknown>req.body.signalName;
  if (typeof signalName != "string") {
    res.status(400);
    res.send({
      error:
        "Body should contain these properties as string { 'signalName': 'iron-plate', 'signalType': 'item', 'signalCount': '1' }",
    });
    return;
  }

  return signalName;
}

function getSignalCountFromRequest(
  req: Request,
  res: Response
): number | undefined {
  const signalCountString = <unknown>req.body?.signalCount;
  if (typeof signalCountString != "string") {
    res.status(400);
    res.send({
      error:
        "Body should contain these properties as string { 'signalName': 'iron-plate', 'signalType': 'item', 'signalCount': '1' }",
    });
    return;
  }

  const signalCount = parseInt(signalCountString);
  if (isNaN(signalCount) || signalCount.toString() !== signalCountString) {
    res.status(400);
    res.send({
      error: "Invalid signalCount. Must be a number",
    });
    return;
  }

  return signalCount;
}

function validateSignalSlot(slot: string): { error?: string; slot?: number } {
  const slotInt = parseInt(slot);
  if (isNaN(slotInt) || slotInt.toString() !== slot) {
    return { error: "Invalid Slot. Must be a number." };
  }

  if (slotInt <= 0 || slotInt > 19) {
    return { error: "Invalid Slot. Slot must be between 1 and 19." };
  }
  return {
    slot: slotInt,
  };
}
