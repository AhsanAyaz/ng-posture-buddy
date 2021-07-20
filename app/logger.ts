import { userDirectory } from "./config";

import { createLogger, Logger, format, transports } from "winston";

let logger;

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//

export default function getLogger(): Logger {
  if (!logger) {
    logger = createLogger({
      level: "info",
      format: format.json(),
      defaultMeta: { service: "user-service" },
      transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new transports.File({
          filename: `${userDirectory.logsDirectory}/error.log`,
          level: "error",
        }),
        new transports.File({
          filename: `${userDirectory.logsDirectory}/combined.log`,
        }),
      ],
    });
    if (process.env.NODE_ENV !== "production") {
      logger.add(
        new transports.Console({
          format: format.simple(),
        })
      );
    }
  }
  return logger;
}
