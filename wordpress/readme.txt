=== Notation Bible ===
Contributors: notationbible
Tags: bible, scripture, strongs, interlinear, commentary
Requires at least: 5.8
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.11.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

The complete Berean Standard Bible reader with Strong's numbers, interlinear, commentaries, highlighting, notes and NoteTrees.

== Description ==

Notation Bible adds a full Bible reader to your site at /bible/ (you can change the address).

* All 66 books of the Berean Standard Bible (BSB), with its headings, paragraphs and footnotes
* Strong's numbers and a Greek and Hebrew concordance
* Greek and Hebrew interlinear for every verse
* Cross-references, Jamieson-Fausset-Brown and Scofield commentaries, KJV, ASV and YLT to compare
* Easton's Bible Dictionary, Nave's and Torrey's topics, Bible places
* Highlighters, pens, sticky notes and NoteTrees (with Apple Pencil support)
* Read aloud and dictation

Readers can sign in with a username and password to a Notation Bible account (separate from WordPress users; no email is used) so their highlights, notes, NoteTrees and settings follow them to every device. Without an account, notes are saved in the reader's own browser. Manage reader accounts under Notation Bible → Readers.

Put the reader in any page or post with the shortcode:

`[notation_bible]` or `[notation_bible ref="John 3:16" height="80vh"]`

= Updates =

The plugin updates itself from its GitHub releases (https://github.com/adamjyo/notationbible/releases). WordPress shows new versions on the Plugins and Updates screens like any other plugin, and automatic updates are switched on when the plugin is first activated. Notation Bible → Settings shows the installed and latest versions and has a "Check for updates now" button.

== Changelog ==

= 1.11.0 =
* Search opens out of the search icon as a floating field, with results in a window that grows under it (no side panel). Enter opens the first result; Escape or a click outside closes it.
* Search removed from the menu, since its icon sits beside the menu button. The icon now stays visible on the smallest phones.
* A Strong's number shows a lookup button instead of opening the lexicon while you type.

= 1.10.0 =
* New address picker: three spinning wheels, Book, Chapter and Verse, with Cancel and Go. Type a letter to jump to a book; arrow keys step a wheel.
* Psalm 119 section headings show their Hebrew letters (they showed codes like &#1488;).

= 1.9.3 =
* A note's box now always takes the colour of the highlight it sits on (older notes saved with an ink colour showed grey).

= 1.9.2 =
* Verse markers: commentary is a small book icon, cross references a chain link.

= 1.9.1 =
* Removed the BSB badge and the "Berean Standard Bible" label under chapter titles (until more translations are offered).
* Phones: the passage bar is centred at the top; long book names are shortened there (Song 8, 1 Thess 5).

= 1.9.0 =
* The pen draws freely on the page: circle words, underline, scribble in the margins, with a finger, Apple Pencil or mouse. Each drawing is tied to the word nearest its middle, so it stays in place when the text size or screen width changes. On phones and tablets two fingers scroll while the pen is in hand. The eraser rubs drawings out (only its colour, when it has one). Drawings sync with reader accounts.

= 1.8.3 =
* One toolbar for everything: selecting text no longer opens a second bar. The toolbar comes out and says what's selected; a colour highlights it, a tool (pen, highlighter, eraser, select to copy) acts on it once, and NoteTree makes a NoteTree from it.

= 1.8.2 =
* Highlights look hand-drawn: a chisel-tip marker stroke with an angled start, a blotted end, uneven edges, a second darker pass and faint streaks.
* Notes on long passages no longer get gold [ ] brackets; their words are highlighted like any other.

= 1.8.1 =
* Menus, buttons and the toolbar use IBM Plex Sans.

= 1.8.0 =
* The Bible text and chapter titles use Source Sans 3. Readers can switch to Source Serif in the reading settings (Typeface).

= 1.7.5 =
* The pop-up Post-it uses the same handwriting as saved notes.

= 1.7.4 =
* Notes under verses are written in a handwriting font (Architects Daughter).

= 1.7.3 =
* Phones and tablets: drag a finger sideways across the text to select it, in place of press-and-hold. Up-and-down drags still scroll.

= 1.7.2 =
* Select tool: selecting text pops up a Copy button. It copies the Bible text (no verse numbers, markers or interlinear rows) with its reference.

= 1.7.1 =
* The note that pops up after highlighting looks like a Post-it in the highlight's colour, with handwriting.

= 1.7.0 =
* Highlighting pops up a note card under the highlight (close it with the X to keep just the highlight). A note takes its highlight's colour, and erasing that colour removes the note too.
* The toolbar's third button makes a NoteTree from the selected verses (or tap a verse).
* New Select tool, for selecting text to copy without marking it.

= 1.6.1 =
* Notes have their own colour (the highlighter colours), separate from the pen: with Note in hand, the Colour button sets the note's colour. The note's box and sticky marker are tinted with it.
* Notes under a verse show only what you wrote (no "My note" label).

= 1.6.0 =
* New markup toolbar with three buttons: the current tool, its colour, and Note. Tool swaps the bar for Pen, Highlighter and Eraser; Colour swaps it for that tool's colours; picking one brings the three buttons back. The bar stays the same size, and each tool keeps its own colour. Tucked away, it shows the current tool over a line in its colour.

= 1.5.1 =
* Safari: the tab shows the title (NotationBible.Com) instead of "Untitled" after moving between chapters.

= 1.5.0 =
* Notes and markup are kept reliably: reader-account answers are never cached by the host or a caching plugin, an old cached copy can never remove notes, reopening the app never clears notes from the device, and the reader always opens at the site's own address (www and non-www keep notes separately).
* Readers who aren't signed in get a one-time reminder to sign in so their notes are saved in the site's database.
* A small pencil at the end of a note edits it.
* The eraser can be set to one colour, to erase only that colour; set to All colours, rubbing over a note deletes it (with Undo).

= 1.4.5 =
* Fix: a note shown under its verse no longer covers the whole page with a gold tint; it sits in its own row beneath the verse it belongs to.

= 1.4.4 =
* Account screens: the icon sits over NotationBible.Com on one line.

= 1.4.3 =
* Logo on the account screens: the purple highlighter is on Notation, with Bible.Com beneath.

= 1.4.2 =
* Logo on the account screens: the word Notation no longer has brackets around it.

= 1.4.1 =
* The collapsed markup toolbar is a highlighter button centred at the bottom of the page.

= 1.4.0 =
* New NotationBible.Com logo: the icon is the menu button and the browser-tab icon, and the sign-in, create-account and password screens show the icon over the stacked name.

= 1.3.1 =
* The browser tab shows "NotationBible.Com" (changeable in Notation Bible → Settings → Browser tab title).

= 1.3.0 =
* Reader accounts use a username instead of an email address, and nothing is emailed. To set up an account or reset a password, make a password link on the Readers page and send it to the reader yourself. Existing readers get a username made from their email name.

= 1.2.1 =
* Interlinear: highlights and selections cover only the English words, not the Greek and Hebrew rows beneath them, and no slivers of colour appear between word blocks.

= 1.2.0 =
* The Bible can be the site's home page (Notation Bible → Settings → Home page). Sites whose home page is still WordPress's empty default switch to it automatically.

= 1.1.1 =
* Forms no longer move the cursor back to the first box after you start typing.

= 1.1.0 =
* Reader accounts, separate from WordPress users: readers sign in from the Bible's menu and their highlights, notes, NoteTrees and settings sync across devices.
* New Notation Bible admin menu with a Readers page (add, disable, delete, send password links, sign out everywhere) and switches for accounts and sign-ups.

= 1.0.1 =
* Updates still arrive when the site cannot reach WordPress.org.

= 1.0.0 =
* First WordPress release: full-page reader, shortcode, settings page and automatic updates from GitHub.
