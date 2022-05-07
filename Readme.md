# Factorio Constant-Combinator REST API

This lets you control factorio constant combinators via a simple REST API.

## Setup

- Enable RCON in Factorio
  - hold `Ctrl` + `Alt` and click on Settings in the Factorio menu
  - go to "The Rest"
  - set `local-rcon-socket` and `local-rcon-password`
  - start a new multiplayer game (single player has no rcon)
- Rename `settings_sample.ts` to `settings.ts`
- Adjust settings
- run `npm install` and `npx ts-node-dev src/main.ts `

## API

The constant combinators are identified by the signal R set in slot 20. In the image below you would use `/cc/995/signals`

![Constant Combinator with id R01](/doc/img/cc_r01.png)

GET `/cc/:id/signals` - Get all signals of the circuit network connected to this combinator

POST `/cc/:id/signal/:signalSlot` - Set `signalSlot`. Body must formatted like this

```
{
    "signalName": "iron-plate",
    "signalType": "item",
    "signalCount": "1"
}
```

DELETE `/cc/:id/signal/:signalSlot` - Unset `signalSlot`
