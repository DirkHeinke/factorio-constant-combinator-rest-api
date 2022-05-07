import Rcon from "rcon-ts";
import { conf } from "./settings";

type Signal = {
  signalName: string;
  signalType: string;
  signalCount: string;
};

export class FactorioConnector {
  private rcon: Rcon;

  constructor() {
    this.rcon = new Rcon({
      host: conf.rcon_host,
      password: conf.rcon_password,
      port: conf.rcon_port,
    });
  }

  async getSignalsFromConstantCombinatorWithId(id: string): Promise<{
    error: boolean;
    data: string | object;
  }> {
    this.rcon.connect();
    const result = await this.rcon.send(`/sc 
        ${this.getCcWithIdLuaFunction}
        
        local cc, doubleError = getCcWithId("${id}")
        
        ${this.validateGetCcResponseLuaFunction}
        
        local redNetwork = cc.get_control_behavior().get_circuit_network(defines.wire_type.red,defines.circuit_connector_id.constant_combinator)
        local greenNetwork = cc.get_control_behavior().get_circuit_network(defines.wire_type.green,defines.circuit_connector_id.constant_combinator)

        if (redNetwork) then
          for key,value in ipairs(redNetwork.signals) do
            rcon.print(value.signal.name..","..value.signal.type..","..value.count)
          end
        end
        
        rcon.print("---")

        if (greenNetwork) then
          for key,value in ipairs(greenNetwork.signals) do
            rcon.print(value.signal.name..","..value.signal.type..","..value.count)
          end
        end
        `);

    if (result.startsWith("ERROR:")) {
      return { error: true, data: result };
    }

    this.rcon.disconnect();

    return {
      error: false,
      data: this.parseSignalResponse(result),
    };
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

        ${this.validateGetCcResponseLuaFunction}

        cc.get_control_behavior().set_signal(${slot},{signal={type="${signalType}", name="${signalName}"}, count=${signalCount}})
        `);
    this.rcon.disconnect();
    return result;
  }

  async deleteSignalToConstantCombinatorWithId(id: string, slot: number) {
    this.rcon.connect();
    const result = await this.rcon.send(`/sc 
        ${this.getCcWithIdLuaFunction}
        
        local cc, doubleError = getCcWithId("${id}")
        
        ${this.validateGetCcResponseLuaFunction}
        
        cc.get_control_behavior().set_signal(${slot},nil)
        `);
    this.rcon.disconnect();
    return result;
  }

  private parseSignalResponse(data: string): {
    red: Signal[];
    green: Signal[];
  } {
    let [redData, greenData] = data.split("---");
    let redSignals: Signal[] = this.stringToSignalArray(redData);
    let greenSignals: Signal[] = this.stringToSignalArray(greenData);

    return {
      green: greenSignals,
      red: redSignals,
    };
  }

  private stringToSignalArray(data: string): Signal[] {
    if (data.length > 0) {
      return data
        .split("\n")
        .filter((line) => line.length > 0)
        .flatMap((line) => {
          const [signalName, signalType, signalCount] = line.split(",");
          return {
            signalName,
            signalType,
            signalCount,
          };
        });
    }
    return [];
  }

  private getCcWithIdLuaFunction = `
    function getCcWithId(id)
        local constantCombinators = game.surfaces[1].find_entities_filtered{type="constant-combinator"};
        local lastCcWithId;
        local foundMultipleCC = false;

        -- rcon.print("Number of combinators: "..table.maxn(constantCombinators))
        for key,value in ipairs(constantCombinators) do
          local signal20 = value.get_control_behavior().get_signal(20)
          
          if (signal20.signal and signal20.signal.name == "signal-R" and signal20.count == tonumber(id)) then
            if (lastCcWithId) then
              foundMultipleCC = true
            end
            
            lastCcWithId = value
          end
        end

        return lastCcWithId, foundMultipleCC
    end
    `;

  private validateGetCcResponseLuaFunction = `
      if(doubleError) then
        rcon.print("ERROR: ID used in multiple combinators")
        return
      end
      if(not cc) then
        rcon.print("ERROR: ID not found")
        return
      end
    `;
}
