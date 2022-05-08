import Rcon from "rcon-ts";
import { conf } from "./settings";

type Signal = {
  signalName: string;
  signalType: string;
  signalCount: string;
};

export class FactorioConnector {
  static async getCircuitSignalsFromConstantCombinatorWithId(
    id: number
  ): Promise<
    | {
        error: true;
        data: string;
      }
    | {
        error: false;
        data: object;
      }
  > {
    const rcon = new Rcon({
      host: conf.rcon_host,
      password: conf.rcon_password,
      port: conf.rcon_port,
    });
    await rcon.connect();
    const result = await rcon.send(`/sc 
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

    rcon.disconnect();
    if (result.startsWith("ERROR:")) {
      return { error: true, data: result };
    }

    return {
      error: false,
      data: this.parseSignalResponse(result),
    };
  }

  static async getSignalFromConstantCombinatorWithId(
    id: number,
    slot: number
  ): Promise<
    | {
        error: true;
        data: string;
      }
    | {
        error: false;
        data: object;
      }
  > {
    const rcon = new Rcon({
      host: conf.rcon_host,
      password: conf.rcon_password,
      port: conf.rcon_port,
    });
    await rcon.connect();
    const result = await rcon.send(`/sc 
        ${this.getCcWithIdLuaFunction}
        
        local cc, doubleError = getCcWithId("${id}")

        ${this.validateGetCcResponseLuaFunction}

        local signalInSlot = cc.get_control_behavior().get_signal( ${slot} )
        if (signalInSlot.signal == nil) then
          rcon.print("ERROR: No Signal in slot")
          return
        end
        rcon.print(signalInSlot.signal.name..","..signalInSlot.signal.type..","..signalInSlot.count)
        `);
    rcon.disconnect();
    if (result.startsWith("ERROR:")) {
      return { error: true, data: result };
    }

    return {
      error: false,
      data: this.signalLineToSignal(result),
    };
  }

  static async setSignalToConstantCombinatorWithId(
    id: number,
    slot: number,
    signalType: string,
    signalName: string,
    signalCount: number
  ) {
    const rcon = new Rcon({
      host: conf.rcon_host,
      password: conf.rcon_password,
      port: conf.rcon_port,
    });
    await rcon.connect();
    const result = await rcon.send(`/sc 
        ${this.getCcWithIdLuaFunction}
        
        local cc, doubleError = getCcWithId("${id}")

        ${this.validateGetCcResponseLuaFunction}

        cc.get_control_behavior().set_signal(${slot},{signal={type="${signalType}", name="${signalName}"}, count=${signalCount}})
        `);
    rcon.disconnect();
    return result;
  }

  static async deleteSignalToConstantCombinatorWithId(
    id: number,
    slot: number
  ) {
    const rcon = new Rcon({
      host: conf.rcon_host,
      password: conf.rcon_password,
      port: conf.rcon_port,
    });
    await rcon.connect();
    const result = await rcon.send(`/sc 
        ${this.getCcWithIdLuaFunction}
        
        local cc, doubleError = getCcWithId("${id}")
        
        ${this.validateGetCcResponseLuaFunction}
        
        cc.get_control_behavior().set_signal(${slot},nil)
        `);
    rcon.disconnect();
    return result;
  }

  private static parseSignalResponse(data: string): {
    red: Signal[];
    green: Signal[];
  } {
    const [redData, greenData] = data.split("---");
    const redSignals: Signal[] = this.stringToSignalArray(redData);
    const greenSignals: Signal[] = this.stringToSignalArray(greenData);

    return {
      green: greenSignals,
      red: redSignals,
    };
  }

  private static stringToSignalArray(data: string): Signal[] {
    if (data.length > 0) {
      return data
        .split("\n")
        .filter((line) => line.length > 0)
        .flatMap((line) => this.signalLineToSignal(line));
    }
    return [];
  }

  private static signalLineToSignal(data: string): Signal {
    const [signalName, signalType, signalCount] = data.split(",");
    return {
      signalName,
      signalType,
      signalCount,
    };
  }

  private static getCcWithIdLuaFunction = `
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

  private static validateGetCcResponseLuaFunction = `
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
