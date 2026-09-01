export class Logger {
  public static info(context: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] [${context}] ${message}`, meta !== undefined ? meta : '');
  }

  public static warn(context: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] [${context}] ${message}`, meta !== undefined ? meta : '');
  }

  public static error(context: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] [${context}] ${message}`, meta !== undefined ? meta : '');
  }
}
