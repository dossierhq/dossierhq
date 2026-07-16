---
"@dossierhq/react-components2": minor
---

Add optional `header`/`footer` props to all screens (`ContentListScreen`,
`ContentEditorScreen`, `PublishedContentListScreen`, `PublishedContentDisplayScreen`,
`SchemaEditorScreen`, `ChangelogListScreen`), for parity with react-components. Consumers
can use them to render app chrome such as a navigation bar around a screen, since screens
occupy the full viewport. Also export the props type of every screen, plus `ScreenChromeProps`.
