import { createServerApp } from "../server/_core/index.js";

export default async (req: any, res: any) => {
  const { app } = await createServerApp();
  // Handle the request using the Express app
  return app(req, res);
};
