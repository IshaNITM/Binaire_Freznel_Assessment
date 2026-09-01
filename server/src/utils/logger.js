export class Logger {
  static info(context, message, meta) {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [INFO] [${context}] ${message}`,
      meta !== undefined ? meta : "",
    );
  }

  static warn(context, message, meta) {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] [WARN] [${context}] ${message}`,
      meta !== undefined ? meta : "",
    );
  }

  static error(context, message, meta) {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] [ERROR] [${context}] ${message}`,
      meta !== undefined ? meta : "",
    );
  }
}
