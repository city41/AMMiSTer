# Beta warning

Until AMMiSTer reaches 1.0.0, it is considered "beta". More features and improvements are coming. And there may be bugs I haven't found yet.

# Releases

## Version 0.29.0

- [All] More improvements to the missing game resolver, it's getting there
- [All] When exporting, warn about file deletion if in "space" mode
- [All] Settings changes now take effect immediately
- [All] File sizes are shown in the details modal for games

## Version 0.28.0

- [All] Atrac17's Arcade Offset database was added.

## Version 0.27.0

- [All] Better styling and drag/drop added to the missing game resolver

This feature is still not done, but it does work. After doing an update, sometimes MRA file names
are changed. AMMiSTer can't truly do anything about this. Instead it will alert you if you plan
contains games that are no longer in the catalog, and let you fix it. It chooses games that are
probably the correct replacement. A lot of times you just need to press okay, but if needed you can
choose other games.

If you want to try this out:

1. Take one of your plan files and open it in a text editor
2. For one of the games, change the `relFilePath` to something else.
3. Open that plan up in AMMiSTer

For example, change this

```
  "relFilePath": "_Arcade/Alien vs. Predator (Euro 940520).mra"
```

To this

```
"relFilePath": "_Arcade/Alie vs. Predator (Euro 940520).mra"
```

Now the missing game resolver should pop up and offer to fix Alien vs Predator for you.

## Version 0.26.0

- [All] Bulk criteria for number of players added
- [All] The currently opened plan's location is listed in the footer
- [All] User is alerted if the file they tried to open is not a plan
- [All] Some minor bug fixes around saving plans
- [Windows] Bug fix: the recent plans menu item was showing the entire path

## Version 0.25.7

- [Windows] Large change to address the Windows problems with exporting.

For Windows, this is a big change. For Linux and Mac this change does hardly anything.

This should fix most (and hopefully all) of the export and general issues that Windows users have been seeing.

==== WINDOWS USERS ALERT====

You will need to rebuild your catalog.json file:

1. Open AMMiSTer
2. go to Catalog > Open Folder
3. delete catalog.json
4. Close AMMiSTer and re-open it
5. Click to build the catalog (this won't take long, it will still use all the cores, roms, etc it downloaded before)

==== Older Plan files no longer work in Windows ====

This means all plan files made in Windows before this version will no longer work. Sorry about that,
but sometimes that is how early software goes. You will know a plan does not work if AMMiSTer says all the games
are missing, and the missing game resolver does not work (clicking okay does nothing).

The upside, all AMMiSTer plan files are now compatible across all OSes.

## Version 0.25.6

- [Windows] Bug fix: fixed part of export that was not handling Windows file paths correctly

## Version 0.25.5

- [Windows] Bug fix: export logs issue that prevented them from being created. These files help debug export problems.

## Version 0.25.4

- [All] Getting the game's categories from the arcade database instead of the MRA file.

## Version 0.25.3

- [All] Bug fix: exporting a plan would delete files unexpectedly.

## Version 0.25.2

- [Windows] Bug fix: core (rbf files) are said to be missing when they are not.

You would be hit by this if:

- you use Windows
- all the games in the catalog on the left side have a red exclamation
- looking at a game, it says the core (rbf file) is missing.

How to fix:

- First install this version of AMMister
- From AMMister's Catalog menu, select "open folder"
- delete the catalog.json file in the folder
- close AMMister and reopen it
- From AMMister's Catalog menu, choose "Check for updates..."
  - This will be a fast check, as it doesn't need to download much

Still having problems? File an issue on GitHub

## Version 0.25.1

- [All] Bug fix: clicking the trash can on a game would not delete it.

## Version 0.25.0

- [All] Resolution added to bulk criteria.
- [All] Rotation in bulk criteria much more detailed now (clockwise vs counter-clockwise, and flippable)

Plus some very minor tweaks/polish

## Version 0.24.2

- [All] Handles cores that lack a date in their name. Before it would error.

## Version 0.24.1

- [All] Handling archive.org errors a little bit better

## Version 0.24.0

- [All] A new feature, "resolve missing games", in an early/beta state.

This feature makes it easier to deal with plans that end up with missing games after an update. It's still early and bit raw, it will get better.

## Version 0.23.0

- [All] Verifying the files in the catalog are all ok
- [All] Plans alerting to corrupt or missing files
- [All] Minor tweaks/fixes to how large plans scroll
- [All] Can cancel an export
- [All] Minor tweaks to styling
- [All] Writing warning.txt in the gameCache
- [All] Plans sort games correctly now

The verifying of the catalog and plans require a lot of changes. So possibly there's some bugs were added.

## Version 0.22.0

- [All] Bulk add: toggle to skip games already in plan
- [All] Settings: export optimization choice
- [All] Fixes around downloading ROMs from archive.org

## Version 0.21.0

- [All] Settings: choose which DBs to get updates from

## Version 0.20.0

- [All] File menu: recently opened plans
- [All] Remembers recently used directories for plans and export to directory

## Version 0.19.1

- [All] Report on a network error if it occurs

## Version 0.19.0

- [All] Start of settings (under the file menu). First setting: whether to download ROMs from archive.org
- [All] Added atrac7's Coin Op Collection DB

ALERT: the "download ROMs" settings defaults to "no". Early adopters, you might be surprised by that.

## Version 0.18.1

- [All] Fix a bulk add bug where rotation was not working correctly
- [All] Fix a builk add bug where once Ghouls 'n' Ghosts showed up, all the games would mess up

## Version 0.18.0

- [Linux] Added an rpm version. I don't use an rpm based distro, so might have issues?
- [All] Bulk add now has region, and some other minor fixes
- [All] Building the catalog for the first time is about 20% faster than before
- [All] Can cancel the catalog build
- [All] Bulk add now previews what games would be added, making exploring easier

## Version 0.17.0

- [All] Bulk add no longer requires typing in a value. All the manufacturers, categories, etc are all available to pick from.

## Version 0.16.0

- [All] A lot more metadata for games thanks to Toryalai's arcade database.

If you already have a catalog, just check for updates to add the new metadata. You can see the new metadata in details about a game (click a game's title),
and also use it for bulk adding (such as adding all games with 4 buttons)

## Version 0.15.6

- [All] Fix: "Open Catalog" menu item now works before a catalog exists
- [All] Fix: the favorite folder can have any case, ie "Favorites" or "FaVoRiTes" for example

## Version 0.15.5

- [All] Fix minor drag and drop issues

## Version 0.15.3

- [All] Fix case sensitivity issue that was incorrectly deleting files

## Version 0.15.2

- [All] Minor fixes and tweaks

## Version 0.15.0

- [All] The welcome message is short and to the point

## Version 0.14.1

- [All] Don't allow a directory to not have a name

## Version 0.14.0

- [All] Favoriting

## Version 0.13.0

- [Mac] Double clicking a plan file loads that plan
- [All] Warning if closing a plan before saving it
- [All] Lots of small polish and tweaks

## Version 0.12.3

- [All] Bulk add fixes

## Version 0.12.0

- [All] File Association (but doesn't fully work yet)

## Version 0.10.0

- [All] App icon

## Version 0.10.0

- [All] Generate detailed log for exports

## Version 0.9.0

- [All] Reworked how plans work

## Version 0.7.0

- [All] Undo and Redo

## Version 0.6.0

- [All] Down in the footer next to the version, it will let you know if a new version is available

## Version 0.5.2

- [All] "Determining what is currently on the MiSTer" during an export is now much faster

## Version 0.5.1

- [All] Bulk add: added core and title as options
- [All] Plan: don't allow a game in a directory more than once

## Version 0.4.1

- [All] Fix bulk adding orientation bug

## Version 0.4.0

- [All] When bulk adding games, if the plan path does not exist, it gets created

## Version 0.3.1

- [All] Simple plan path validation in "Bulk Add"

## Version 0.3.0

- [All] Initial implemenetation of "Bulk Add"

## Version 0.2.1

- [All] Add Quit to file menu
- [Mac] Fixed accelerators issue

## Version 0.2.0

- [All] Warning first update is slow
- [All] Warning about alternative ROMs
- [All] Error if failure to connect to a mister
- [All] Error reporting on export errors
- [All] Error reporting on update errors
- [Mac] Fixed accelerators to use cmnd instead of ctrl

## Version 0.1.1

- [All] Fixed a bug where it would delete remote paths incorrectly

## Version 0.1.0

- [All] Switch from SFTP to FTP, making exports more than twice as fast

## Version 0.0.5

- [Windows] Paths on the mister don't use backslashes :)

## Version 0.0.4

- [Windows] Fix the remaining path separator issues that caused it to think all cores were missing

## Version 0.0.3

- [Windows] Fix a path separator issue that caused it to think all cores were missing

## Version 0.0.2

- [All] Welcome has a warning about being an alpha version

## Version 0.0.1

- [Windows] Bug Fix: prevented app from crashing at startup

## Version 0.0.0

Under development
