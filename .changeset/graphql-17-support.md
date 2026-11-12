---
"@dossierhq/graphql": patch
---

Support graphql 17. `@skip`/`@include` directives using variables are now evaluated correctly with graphql 17, where `info.variableValues` changed shape. graphql 16 remains supported.
