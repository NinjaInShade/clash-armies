## [Unreleased]

- Fix `openModalAsync` always resolving with undefined (fixes the bug with not being able to delete army since confirm modal always returns false)
- Fix "load more" button sometimes showing when filters have been applied but when there's no more armies to load
- Fix certain usernames containing invalid characters which breaks the users account page (added stricter validation when editing username)
- Fix being able to spam "Create" button to create duplicated armies by accident

## [0.0.1] - 2024-07-13

- Initial release
