import { copyEntity, Entity, EntityStatus } from "@dossierhq/core";
import { assertEquals } from "std/testing/asserts.ts";

Deno.test("copyEntity()", () => {
  const original: Entity = {
    id: "123",
    info: {
      type: "Foo",
      name: "Hello",
      version: 1,
      authKey: "",
      status: EntityStatus.draft,
      valid: true,
      validPublished: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    fields: { title: "message" },
  };

  const copy = copyEntity(original, { fields: { title: "hello" } });
  assertEquals(copy, { ...original, fields: { title: "hello" } });
});
