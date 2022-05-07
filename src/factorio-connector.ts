import Rcon from "rcon-ts";
import { conf } from "./settings";

export class FactorioConnector {
  private rcon: Rcon;

  constructor() {
    this.rcon = new Rcon({
      host: conf.rcon_host,
      password: conf.rcon_password,
      port: conf.rcon_port,
    });
  }

  async getConstantCombinatorWithId(id: string) {
    this.rcon.connect();
    const result = await this.rcon.send(`/sc 
        ${this.getCcWithIdLuaFunction}
        
        local cc, doubleError = getCcWithId("${id}")
        if(doubleError) then
            rcon.print("ERROR: Double CC-ID")
            return
        end
        if(not cc) then
            rcon.print("ERROR: ID not found")
            return
        end
        rcon.print(serpent.block(cc.get_control_behavior().get_circuit_network(defines.wire_type.red,defines.circuit_connector_id.constant_combinator).signals))
        `);
    /**
     * TODO
     * Ergebnisse parsen und umwandeln (Error berücksichtigen)
     * Rot und Grün
     */
    this.rcon.disconnect();
    return result;
  }

  async setSignalToConstantCombinatorWithId(
    id: string,
    slot: number,
    signalType: string,
    signalName: string,
    signalCount: number
  ) {
    this.rcon.connect();
    const result = await this.rcon.send(`/sc 
        ${this.getCcWithIdLuaFunction}
        
        local cc, doubleError = getCcWithId("${id}")
        if(doubleError) then
            rcon.print("ERROR: Double CC-ID")
            return
        end
        if(not cc) then
            rcon.print("ERROR: ID not found")
            return
        end
        cc.get_control_behavior().set_signal(${slot},{signal={type="${signalType}", name="${signalName}"}, count=${signalCount}})
        `);
    /**
     * TODO
     * Ergebnisse parsen und umwandeln (Error berücksichtigen)
     * Rot und Grün
     */
    console.log(result);
    this.rcon.disconnect();
    return result;
  }

  async deleteSignalToConstantCombinatorWithId(id: string, slot: number) {
    this.rcon.connect();
    const result = await this.rcon.send(`/sc 
        ${this.getCcWithIdLuaFunction}
        
        local cc, doubleError = getCcWithId("${id}")
        if(doubleError) then
            rcon.print("ERROR: Double CC-ID")
            return
        end
        if(not cc) then
            rcon.print("ERROR: ID not found")
            return
        end
        cc.get_control_behavior().set_signal(${slot},nil)
        `);
    /**
     * TODO
     * Ergebnisse parsen und umwandeln (Error berücksichtigen)
     * Rot und Grün
     */
    console.log(result);
    this.rcon.disconnect();
    return result;
  }

  private getCcWithIdLuaFunction = `
    function getCcWithId(id)
        local constantCombinators = game.surfaces[1].find_entities_filtered{type="constant-combinator"};
        local lastCcWithId;
        local foundMultipleCC = false;

        -- rcon.print("Number of combinators: "..table.maxn(constantCombinators))
        for key,value in ipairs(constantCombinators) do
            local signal18 = value.get_control_behavior().get_signal(18)
            local signal19 = value.get_control_behavior().get_signal(19)
            local signal20 = value.get_control_behavior().get_signal(20)
            if (signal18.signal and signal18.signal.name == "signal-R" and
                signal19.signal and signal19.signal.name == "signal-"..string.sub(id,1,1) and
                signal20.signal and signal20.signal.name == "signal-"..string.sub(id,2,2)
                ) then
                    if (lastCcWithId) then
                        foundMultipleCC = true
                    end
                    
                    lastCcWithId = value
            end
        end

        return lastCcWithId, foundMultipleCC
    end
    `;
}
