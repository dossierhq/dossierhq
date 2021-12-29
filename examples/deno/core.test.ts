import {
  AdminEntity,
  AdminEntityStatus,
  copyEntity,
} from "@jonasb/datadata-core";
import { Temporal } from "@js-temporal/polyfill";
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
      createdAt: Temporal.Now.instant(),
      updatedAt: Temporal.Now.instant(),
    },
    fields: { title: "message" },
  };

  const copy = copyEntity(original, { fields: { title: "hello" } });
  assertEquals(copy, { ...original, fields: { title: "hello" } });
});
