import { AdminEntity, AdminEntityStatus, copyEntity } from "@dossierhq/core";
import { assertEquals } from "std/testing/asserts.ts";

Deno.test("copyEntity()", () => {
  const original: AdminEntity = {
    id: "123",
    info: {
      type: "Foo",
      name: "Hello",
      version: 0,
      authKey: "none",
      status: AdminEntityStatus.draft,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    fields: { title: "message" },
  };

  const copy = copyEntity(original, { fields: { title: "hello" } });
  assertEquals(copy, { ...original, fields: { title: "hello" } });
});
