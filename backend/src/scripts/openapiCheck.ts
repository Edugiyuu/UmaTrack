/**
 * Compares the routes registered in Express with the paths of the OpenAPI spec
 * (docs/tasks/18-api-swagger.md). Fails when a route has no documentation, when the
 * spec documents a route that does not exist, or when the spec is inconsistent.
 * Starts no server and touches no database.
 */
import type { OpenAPIV3_1 } from "openapi-types";
import routes from "../routes";
import { buildOpenApiDocument } from "../docs/openapi";

interface Operation {
  method: string;
  path: string;
  auth: boolean;
}

/**
 * Handlers registered straight on the app in app.ts, outside the routers, so walking
 * the router cannot see them. /docs and /openapi.json are left out: they serve the
 * spec and are not part of it.
 */
const APP_ROUTES: Operation[] = [{ method: "GET", path: "/", auth: false }];

/** The bits of Express 5's router internals this script reads. */
interface Layer {
  name: string;
  handle: { stack?: Layer[] };
  route?: { path: string; methods: Record<string, boolean>; stack: { name: string }[] };
}

/**
 * Walks the router: layers with `route` are routes, layers whose handle has a `stack`
 * are sub-routers. Every sub-router is mounted without a prefix (`router.use(x)`); one
 * mounted under a prefix would show up here as undocumented routes.
 */
const collectRoutes = (stack: Layer[]): Operation[] =>
  stack.flatMap((layer) => {
    if (layer.route) {
      const { path, methods, stack: handlers } = layer.route;
      const auth = handlers.some((handler) => handler.name === "authMiddleware");
      return Object.keys(methods)
        .filter((method) => method !== "_all")
        .map((method) => ({ method: method.toUpperCase(), path, auth }));
    }
    return layer.handle.stack ? collectRoutes(layer.handle.stack) : [];
  });

/** Express writes `/horse/:id`, OpenAPI writes `/horse/{id}`. */
const toOpenApiPath = (path: string) => path.replace(/:(\w+)/g, "{$1}");

const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

const collectSpec = (document: OpenAPIV3_1.Document) =>
  Object.entries(document.paths ?? {}).flatMap(([path, item]) =>
    HTTP_METHODS.filter((method) => item?.[method]).map((method) => ({
      method: method.toUpperCase(),
      path,
      operation: item![method]!
    }))
  );

/** Every `$ref` in the document, with where it was found. */
const collectRefs = (node: unknown, where: string, found: { ref: string; where: string }[] = []) => {
  if (Array.isArray(node)) {
    node.forEach((item, index) => collectRefs(item, `${where}[${index}]`, found));
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "$ref" && typeof value === "string") found.push({ ref: value, where });
      else collectRefs(value, `${where}.${key}`, found);
    }
  }
  return found;
};

const resolvePointer = (document: unknown, ref: string) =>
  ref
    .replace(/^#\//, "")
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), document);

const key = (operation: { method: string; path: string }) => `${operation.method} ${operation.path}`;

const main = () => {
  const document = buildOpenApiDocument();

  const expressOps = [
    ...APP_ROUTES,
    ...collectRoutes((routes as unknown as { stack: Layer[] }).stack).map((operation) => ({
      ...operation,
      path: toOpenApiPath(operation.path)
    }))
  ];
  const specOps = collectSpec(document);

  const expressKeys = new Map(expressOps.map((operation) => [key(operation), operation]));
  const specKeys = new Map(specOps.map((operation) => [key(operation), operation]));

  const problems: string[] = [];

  for (const [name] of expressKeys) {
    if (!specKeys.has(name)) problems.push(`Rota sem documentação: ${name}`);
  }
  for (const [name] of specKeys) {
    if (!expressKeys.has(name)) problems.push(`Documentação de rota que não existe: ${name}`);
  }

  for (const [name, { operation }] of specKeys) {
    if (!operation.summary) problems.push(`${name}: sem summary`);
    if (!operation.tags?.length) problems.push(`${name}: sem tags`);
    if (!Object.keys(operation.responses ?? {}).some((status) => status.startsWith("2"))) {
      problems.push(`${name}: sem resposta 2xx`);
    }

    const route = expressKeys.get(name);
    if (!route) continue;
    const secured = operation.security?.some((requirement) => "bearerAuth" in requirement) ?? false;
    if (route.auth && !secured) problems.push(`${name}: usa authMiddleware mas não tem security bearerAuth`);
    if (!route.auth && secured) problems.push(`${name}: tem security bearerAuth mas a rota não usa authMiddleware`);
  }

  for (const { ref, where } of collectRefs(document, "#")) {
    if (!ref.startsWith("#/") || resolvePointer(document, ref) === undefined) {
      problems.push(`$ref quebrado em ${where}: ${ref}`);
    }
  }

  const tags = new Set(specOps.flatMap(({ operation }) => operation.tags ?? []));
  console.log(`Express: ${expressOps.length} operações · spec: ${specOps.length} operações em ${tags.size} tags`);

  if (problems.length) {
    console.error(`\n${problems.length} problema(s):`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    process.exit(1);
  }

  console.log("✓ Todas as rotas estão documentadas e a spec está consistente.");
};

main();
