<?php
/**
 * Plugin Name:       Notation Bible
 * Plugin URI:        https://github.com/adamjyo/notationbible
 * Description:       The complete Berean Standard Bible with Strong's numbers, Greek and Hebrew interlinear, footnotes, cross-references, commentaries, highlighting, notes and NoteTrees. Serves a full-page reader and a [notation_bible] shortcode.
 * Version:           1.9.2
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Notation Bible
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       notation-bible
 * Update URI:        https://github.com/adamjyo/notationbible
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'NB_VERSION', '1.9.2' );
define( 'NB_FILE', __FILE__ );
define( 'NB_DIR', plugin_dir_path( __FILE__ ) );
define( 'NB_URL', plugin_dir_url( __FILE__ ) );
define( 'NB_REPO', 'adamjyo/notationbible' );

require_once NB_DIR . 'includes/class-nb-reader.php';
require_once NB_DIR . 'includes/class-nb-updater.php';
require_once NB_DIR . 'includes/class-nb-accounts.php';
require_once NB_DIR . 'includes/class-nb-admin.php';
require_once NB_DIR . 'includes/class-nb-readers-admin.php';

NB_Reader::init();
NB_Updater::init();
NB_Accounts::init();
NB_Admin::init();
NB_Readers_Admin::init();

register_activation_hook( __FILE__, array( 'NB_Reader', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'NB_Reader', 'deactivate' ) );
