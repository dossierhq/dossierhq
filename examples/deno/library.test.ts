import { TEMPLATE_VALUE } from "@jonasb/datadata-template-library";
import { assertEquals } from "std/testing/asserts.ts";

Deno.test("copyEntity()", () => {
  assertEquals(TEMPLATE_VALUE, {
    value: "hello world",
  });
});
