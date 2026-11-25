<?php
// Removes Notation Bible's settings when the plugin is deleted. Readers' notes live in their own browsers and are not touched.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
$nb_settings = get_option( 'nb_settings', array() );
if ( is_array( $nb_settings ) && ! empty( $nb_settings['delete_data'] ) ) {
	global $wpdb;
	foreach ( array( 'readers', 'sessions', 'reader_data' ) as $nb_t ) {
		$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'nb_' . $nb_t ); // phpcs:ignore WordPress.DB
	}
	delete_option( 'nb_db_version' );
}
wp_clear_scheduled_hook( 'nb_cleanup_sessions' );
delete_option( 'nb_settings' );
delete_option( 'nb_last_check' );
delete_option( 'nb_flush_rewrite' );
delete_option( 'nb_auto_update_set' );
delete_site_transient( 'nb_latest_release' );
// Commentary packs are plugin files kept in uploads: they go with the plugin.
require_once __DIR__ . '/includes/class-nb-packs.php';
NB_Packs::remove_all();
