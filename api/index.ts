import { createServerApp } from "../server/_core/index";

export default async (req: any, res: any) => {
  const { app } = await createServerApp(true);
  // Handle the request using the Express app
  return app(req, res);
};
