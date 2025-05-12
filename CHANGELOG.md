## [0.3.2] - 2025-05-12

- Add ads.txt file

## [0.3.2] - 2025-05-12

- Fix bugs with importing from army link

## [0.3.1] - 2025-04-20

- Fix login button not closing sidebar

## [0.3.0] - 2025-04-20

- Add import/export/copy link support for clan castle & heroes
- Add fine-grained hero selection (along with Minion Prince support)
- Add comment notifications
- Remove training time
- Remove max armies display text
- Fix scrolling position bug when navigating
- Add all new troops/spells/pets/equipment and new levels
- (internal) refactor codebase for easier expansion
- (internal) update to latest packages

## [0.2.0] - 2024-09-07

- Add guide support to armies
- Add ability to comment on armies
- Add ability to import units from clash of clans army link
- Add new "Magic Mirror" archer queen equipment
- Improve and extend filtering UI/capabilities

## [0.1.1] - 2024-08-03

- Fix attack type filter not working
- Fix being able to use certain equipment when it isn't unlocked yet

## [0.1.0] - 2024-08-02

- Add hero equipment and pet support to armies
- Add clan castle support to armies
- Add ability to save/bookmark armies
- Add new banners
- Add buy me a coffee support link
- Add unit tests
- Add "Create army" button on home page to make it more clear that users can create armies
- Display CHANGELOG.md on /changelog page
- Increase user army limit from 20 to 40

## [0.0.2] - 2024-07-14

- Fix `openModalAsync` always resolving with undefined (fixes the bug with not being able to delete army since confirm modal always returns false)
- Fix "load more" button sometimes showing when filters have been applied but when there's no more armies to load
- Fix certain usernames containing invalid characters which breaks the users account page (added stricter validation when editing username)
- Fix being able to spam "Create" button to create duplicated armies by accident
- Fix invalid static path when editing troop/townhall images from admin panel
- Add new "druid" troop

## [0.0.1] - 2024-07-13

- Initial release
