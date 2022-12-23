import { Validator } from "jsonschema";
import Typing from "./Schema.json";

const validator = new Validator();
validator.addSchema(Typing);

export function validateSchema<T>(type: string, instance: any): T {
  const result = validator.validate(
    instance,
    {
      $ref: `#/definitions/${type}`,
    },
    {
      allowUnknownAttributes: true,
    }
  );
  if (!result.valid) {
    throw Error(`schema mismatch [${type}]: ${JSON.stringify(instance)}`);
  }
  return instance;
}
