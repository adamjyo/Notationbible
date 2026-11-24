=== Notation Bible ===
Contributors: notationbible
Tags: bible, scripture, strongs, interlinear, commentary
Requires at least: 5.8
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.6.0
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
