import z from "zod";
import { OpenAPIHandler } from "./utils/openapi";

const pathParameterSchema = z.object({
  userEmail: z.email().meta({ example: "john@doe.com" }),
});

const queryParameterSchema = z.object({
  includePosts: z.boolean().optional().meta({
    description: "Whether or not to include posts in user response",
  }),
  page: z.number().optional().meta({
    example: 2,
    description:
      "Page number to include for posts. Each page has 50 posts. Starts from 0.",
  }),
});

const responseSchemaOK = z.object({
  logId: z.uuid().meta({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  userObject: z.object({
    name: z.string().meta({ example: "Loremus" }),
    profile: z.url().meta({ example: "Image url for profile picture" }),
    description: z
      .string()
      .meta({ example: "Description of the user profile" }),
  }),
  posts: z.array(
    z.object({
      id: z.uuid().meta({ example: "550e8400-e29b-41d4-a716-446655440000" }),
      name: z.string().meta({ example: "Post Title" }),
      description: z.string().meta({ example: "Post Description" }),
      tags: z
        .array(z.string())
        .meta({ example: '["typescript", "nextjs"] and other tags in post' }),
    }),
  ),
});

const responseSchemaError = z.object({
  error: z.string().meta({ example: "Error message...." }),
  logId: z.uuid().meta({ example: "550e8400-e29b-41d4-a716-446655440000" }),
});

const pathName = "/api/users/{userEmail}";
const docs = new OpenAPIHandler("3.0.0", "OpenAI Test", "0.3");
docs.path(pathName, "get", {
  summary: "Read user data",
  description:
    "Reads user data by userEmail. Returns user metadata and posts optionally.",
  tags: ["User"],
});
docs.pathParameters(pathName, "get", pathParameterSchema);
docs.queryParameters(pathName, "get", queryParameterSchema);
docs.response(
  pathName,
  "get",
  "200",
  "Returns user profile metadata and posts optionally",
  responseSchemaOK,
);
docs.response(
  pathName,
  "get",
  "500",
  "Returned error object as string and logId for developers.",
  responseSchemaError,
);
console.dir(docs.export());
