<?php
// Removes Notation Bible's settings when the plugin is deleted. Readers' notes live in their own browsers and are not touched.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'nb_settings' );
delete_option( 'nb_last_check' );
delete_option( 'nb_flush_rewrite' );
delete_option( 'nb_auto_update_set' );
delete_site_transient( 'nb_latest_release' );
