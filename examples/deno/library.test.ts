import { TEMPLATE_VALUE } from "@dossierhq/template-library";
import { assertEquals } from "std/testing/asserts.ts";

Deno.test("copyEntity()", () => {
  assertEquals(TEMPLATE_VALUE, {
    value: "hello world",
  });
});
