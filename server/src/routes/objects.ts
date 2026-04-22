import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import { HttpError } from "../http/errors.js";
import { idParam } from "../http/validate.js";

const ObjectTypeEnum = z.enum([
  "place",
  "restaurant",
  "cafe",
  "bar",
  "perfume",
  "album",
  "fashion",
  "sneaker",
  "product",
]);

const createSchema = z.object({
  type: ObjectTypeEnum,
  title: z.string().min(1).max(120),
  subtitle: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  neighborhood: z.string().max(80).optional(),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  shortDescriptor: z.string().max(280).optional(),
  heroImage: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

export const objectsRouter = new Hono()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        type: ObjectTypeEnum.optional(),
        city: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      }),
    ),
    async (c) => {
      const q = c.req.valid("query");
      const objects = await prisma.object.findMany({
        where: {
          type: q.type ?? undefined,
          city: q.city ?? undefined,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: q.limit + 1,
        ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      });
      const nextCursor =
        objects.length > q.limit ? objects[q.limit]!.id : null;
      return c.json({
        objects: objects.slice(0, q.limit),
        nextCursor,
      });
    },
  )
  .get(
    "/:id",
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const { id } = c.req.valid("param");
      const object = await prisma.object.findUnique({
        where: { id },
        include: {
          _count: { select: { posts: true, entries: true } },
        },
      });
      if (!object) throw HttpError.notFound();
      return c.json({ object });
    },
  )
  .post("/", zValidator("json", createSchema), async (c) => {
    const input = c.req.valid("json");
    const object = await prisma.object.create({ data: input });
    return c.json({ object }, 201);
  });
