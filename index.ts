import z from "zod";
import { OpenAPIHandler } from "./utils/openapi";

const docs = new OpenAPIHandler("3.1.1", "OpenAPI Docs Example", "0.3");
docs.path("/users/{userId}", "get", {
  summary: "Read Users",
  description: "Lists all users",
  tags: ["Search"],
});
docs.queryParameters(
  "/users/{userId}",
  "get",
  z.object({
    page: z
      .number()
      .optional()
      .meta({ example: 2, description: "Page number" }),
    filter: z
      .enum(["verified", "below 18", "above 18"])
      .meta({ example: "verified", description: "Filters for user list" }),
  }),
);
docs.pathParameters(
  "/users/{userId}",
  "get",
  z.object({
    userId: z.email().meta({
      example: "john@doe.cum",
      description: "Will only list friends of user X",
    }),
  }),
);
console.dir(docs.export());
