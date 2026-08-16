---
"@dossierhq/cloudinary": minor
---

**Breaking:** move to `@dossierhq/react-components2`. `CloudinaryImageFieldEditor` and
`CloudinaryImageFieldDisplay` are rewritten with Tailwind and no longer depend on
`@dossierhq/design`, and `FieldEditorProps` is now imported from
`@dossierhq/react-components2`.

Consumers must import the new stylesheet: `import '@dossierhq/cloudinary/main.css';`.
Without it the components render unstyled. The stylesheet deliberately omits Tailwind's
preflight, since host apps already load it via `@dossierhq/react-components2/main.css`.
