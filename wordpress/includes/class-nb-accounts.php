<?php
/**
 * Notation Bible reader accounts.
 *
 * Readers get their own accounts, kept apart from WordPress users: signing up for the
 * Bible never creates a WordPress login. Each account stores the reader's highlights,
 * notes, NoteTrees, reading plan and display settings so they follow the reader to any
 * device.
 *
 * Storage: three tables (readers, sessions, reader data).
 * Sign-in: a random session token in an HttpOnly, SameSite=Lax cookie; only its SHA-256
 * hash is stored. Passwords use WordPress's password hashing.
 * API: REST routes under /wp-json/notationbible/v1/. Requests that change anything must
 * send the header "X-NB-Request: 1", which other sites cannot add without permission.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class NB_Accounts {

	const DB_VERSION   = '2';
	const NS           = 'notationbible/v1';
	const COOKIE       = 'nb_reader';
	const SESSION_DAYS = 60;
	const MAX_DOC      = 8388608; // 8 MB of notes per reader.
	const MIN_PASS     = 8;

	/** @var array|null|false The signed-in reader for this request; false means not looked up yet. */
	private static $reader = false;

	public static function init() {
		add_action( 'plugins_loaded', array( __CLASS__, 'maybe_install' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
		add_action( 'nb_cleanup_sessions', array( __CLASS__, 'cleanup' ) );
		add_filter( 'rest_post_dispatch', array( __CLASS__, 'no_cache' ), 10, 3 );
	}

	/**
	 * Answers about a reader must never come from a page cache (host caching such as
	 * SiteGround's, caching plugins, CDNs): a cached "signed out" or an old copy of
	 * someone's notes would hide or undo their changes.
	 */
	public static function no_cache( $result, $server, $request ) {
		if ( 0 !== strpos( (string) $request->get_route(), '/' . self::NS . '/' ) ) {
			return $result;
		}
		if ( ! defined( 'DONOTCACHEPAGE' ) ) {
			define( 'DONOTCACHEPAGE', true ); // WP Rocket, W3 Total Cache, WP Super Cache, SiteGround Optimizer and others
		}
		if ( $result instanceof WP_REST_Response ) {
			$result->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0' );
			$result->header( 'Pragma', 'no-cache' );
			$result->header( 'Expires', '0' );
			$result->header( 'Vary', 'Cookie' );
		}
		return $result;
	}

	/* ---------- tables ---------- */

	public static function table( $name ) {
		global $wpdb;
		return $wpdb->prefix . 'nb_' . $name;
	}

	/** Creates or upgrades the tables. Runs after plugin updates too, not only on activation. */
	public static function maybe_install() {
		if ( get_option( 'nb_db_version' ) === self::DB_VERSION ) {
			return;
		}
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$c = $wpdb->get_charset_collate();
		dbDelta(
			'CREATE TABLE ' . self::table( 'readers' ) . " (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			username varchar(60) NOT NULL DEFAULT '',
			email varchar(190) NULL DEFAULT NULL,
			name varchar(100) NOT NULL DEFAULT '',
			pass varchar(255) NOT NULL DEFAULT '',
			status varchar(20) NOT NULL DEFAULT 'active',
			created datetime NOT NULL,
			last_login datetime NULL,
			reset_hash varchar(64) NOT NULL DEFAULT '',
			reset_exp bigint(20) NOT NULL DEFAULT 0,
			PRIMARY KEY  (id),
			KEY username (username)
			) $c;"
		);
		dbDelta(
			'CREATE TABLE ' . self::table( 'sessions' ) . " (
			token char(64) NOT NULL,
			reader_id bigint(20) unsigned NOT NULL,
			created bigint(20) NOT NULL,
			expires bigint(20) NOT NULL,
			agent varchar(190) NOT NULL DEFAULT '',
			PRIMARY KEY  (token),
			KEY reader_id (reader_id)
			) $c;"
		);
		dbDelta(
			'CREATE TABLE ' . self::table( 'reader_data' ) . " (
			reader_id bigint(20) unsigned NOT NULL,
			rev bigint(20) unsigned NOT NULL DEFAULT 0,
			updated datetime NOT NULL,
			data longtext NOT NULL,
			PRIMARY KEY  (reader_id)
			) $c;"
		);
		// Version 1 signed readers in by email; give them usernames. dbDelta neither drops
		// the old unique email index nor relaxes NOT NULL, so do both here.
		$t = self::table( 'readers' );
		if ( $wpdb->get_var( "SHOW INDEX FROM $t WHERE Key_name = 'email'" ) ) { // phpcs:ignore WordPress.DB.PreparedSQL
			$wpdb->query( "ALTER TABLE $t DROP INDEX email" ); // phpcs:ignore WordPress.DB
		}
		$wpdb->query( "ALTER TABLE $t MODIFY email varchar(190) NULL DEFAULT NULL" ); // phpcs:ignore WordPress.DB
		foreach ( (array) $wpdb->get_results( "SELECT id, email FROM $t WHERE username = ''", ARRAY_A ) as $row ) { // phpcs:ignore WordPress.DB.PreparedSQL
			$wpdb->update( $t, array( 'username' => self::free_username( strstr( (string) $row['email'], '@', true ) ) ), array( 'id' => (int) $row['id'] ) );
		}
		update_option( 'nb_db_version', self::DB_VERSION );
		if ( ! wp_next_scheduled( 'nb_cleanup_sessions' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'nb_cleanup_sessions' );
		}
	}

	public static function cleanup() {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( 'DELETE FROM ' . self::table( 'sessions' ) . ' WHERE expires < %d', time() ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	}

	/* ---------- settings ---------- */

	public static function enabled() {
		return ! empty( NB_Reader::settings()['accounts'] );
	}

	public static function signups_open() {
		return self::enabled() && ! empty( NB_Reader::settings()['signups'] );
	}

	/* ---------- readers ---------- */

	public static function get( $id ) {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table( 'readers' ) . ' WHERE id = %d', $id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
	}

	public static function get_by_username( $username ) {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table( 'readers' ) . ' WHERE username = %s', self::clean_username( $username ) ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
	}

	/** Usernames: 3–40 letters, numbers, dots, dashes or underscores; not case-sensitive. */
	public static function clean_username( $u ) {
		return strtolower( trim( (string) $u ) );
	}

	public static function valid_username( $u ) {
		return (bool) preg_match( '/^[a-z0-9._-]{3,40}$/', $u );
	}

	/** A username based on $base that nobody has yet. */
	private static function free_username( $base ) {
		$base = substr( preg_replace( '/[^a-z0-9._-]/', '', self::clean_username( $base ) ), 0, 34 );
		$base = strlen( $base ) < 3 ? 'reader' : $base;
		$name = $base;
		for ( $i = 2; self::get_by_username( $name ); $i++ ) {
			$name = $base . $i;
		}
		return $name;
	}

	/** @return int|WP_Error */
	public static function create( $name, $username, $password = '' ) {
		global $wpdb;
		$username = self::clean_username( $username );
		$name     = trim( sanitize_text_field( (string) $name ) );
		if ( ! self::valid_username( $username ) ) {
			return new WP_Error( 'nb_user', 'Usernames are 3 to 40 letters or numbers (dots, dashes and underscores are fine too), with no spaces.', array( 'status' => 400 ) );
		}
		if ( '' === $name ) {
			$name = $username;
		}
		if ( '' !== $password && strlen( $password ) < self::MIN_PASS ) {
			return new WP_Error( 'nb_pass', sprintf( 'Use at least %d characters for the password.', self::MIN_PASS ), array( 'status' => 400 ) );
		}
		if ( self::get_by_username( $username ) ) {
			return new WP_Error( 'nb_exists', 'That username is taken. Try another one.', array( 'status' => 409 ) );
		}
		$ok = $wpdb->insert(
			self::table( 'readers' ),
			array(
				'username' => $username,
				'name'     => mb_substr( $name, 0, 100 ),
				'pass'    => '' === $password ? '' : wp_hash_password( $password ),
				'status'  => 'active',
				'created' => current_time( 'mysql', true ),
			)
		);
		if ( ! $ok ) {
			return new WP_Error( 'nb_db', 'The account could not be saved.', array( 'status' => 500 ) );
		}
		return (int) $wpdb->insert_id;
	}

	public static function set_password( $id, $password ) {
		global $wpdb;
		$wpdb->update( self::table( 'readers' ), array( 'pass' => wp_hash_password( $password ), 'reset_hash' => '', 'reset_exp' => 0 ), array( 'id' => (int) $id ) );
	}

	public static function set_status( $id, $status ) {
		global $wpdb;
		$wpdb->update( self::table( 'readers' ), array( 'status' => 'disabled' === $status ? 'disabled' : 'active' ), array( 'id' => (int) $id ) );
		if ( 'disabled' === $status ) {
			self::end_sessions( $id );
		}
	}

	public static function delete( $id ) {
		global $wpdb;
		$id = (int) $id;
		$wpdb->delete( self::table( 'sessions' ), array( 'reader_id' => $id ) );
		$wpdb->delete( self::table( 'reader_data' ), array( 'reader_id' => $id ) );
		$wpdb->delete( self::table( 'readers' ), array( 'id' => $id ) );
	}

	public static function public_reader( $r ) {
		return $r ? array(
			'id'       => (int) $r['id'],
			'name'     => $r['name'],
			'username' => $r['username'],
		) : null;
	}

	/* ---------- sessions ---------- */

	public static function start_session( $id ) {
		global $wpdb;
		$token   = bin2hex( random_bytes( 32 ) );
		$expires = time() + self::SESSION_DAYS * DAY_IN_SECONDS;
		$wpdb->insert(
			self::table( 'sessions' ),
			array(
				'token'     => hash( 'sha256', $token ),
				'reader_id' => (int) $id,
				'created'   => time(),
				'expires'   => $expires,
				'agent'     => mb_substr( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ?? '' ) ), 0, 190 ),
			)
		);
		$wpdb->update( self::table( 'readers' ), array( 'last_login' => current_time( 'mysql', true ) ), array( 'id' => (int) $id ) );
		self::cookie( $token, $expires );
		self::$reader = self::get( $id );
	}

	private static function cookie( $value, $expires ) {
		if ( headers_sent() ) {
			return;
		}
		setcookie(
			self::COOKIE,
			$value,
			array(
				'expires'  => $expires,
				'path'     => COOKIEPATH ? COOKIEPATH : '/',
				'domain'   => COOKIE_DOMAIN ? COOKIE_DOMAIN : '',
				'secure'   => is_ssl(),
				'httponly' => true,
				'samesite' => 'Lax',
			)
		);
	}

	public static function end_session() {
		global $wpdb;
		$token = isset( $_COOKIE[ self::COOKIE ] ) ? sanitize_text_field( wp_unslash( $_COOKIE[ self::COOKIE ] ) ) : '';
		if ( $token ) {
			$wpdb->delete( self::table( 'sessions' ), array( 'token' => hash( 'sha256', $token ) ) );
		}
		self::cookie( '', time() - YEAR_IN_SECONDS );
		self::$reader = null;
	}

	public static function end_sessions( $id ) {
		global $wpdb;
		$wpdb->delete( self::table( 'sessions' ), array( 'reader_id' => (int) $id ) );
	}

	/** The signed-in reader, or null. */
	public static function current() {
		if ( false !== self::$reader ) {
			return self::$reader;
		}
		self::$reader = null;
		$token        = isset( $_COOKIE[ self::COOKIE ] ) ? sanitize_text_field( wp_unslash( $_COOKIE[ self::COOKIE ] ) ) : '';
		if ( ! $token || ! preg_match( '/^[a-f0-9]{64}$/', $token ) || ! self::enabled() ) {
			return null;
		}
		global $wpdb;
		$s = $wpdb->get_row( $wpdb->prepare( 'SELECT reader_id, expires FROM ' . self::table( 'sessions' ) . ' WHERE token = %s', hash( 'sha256', $token ) ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		if ( ! $s || (int) $s['expires'] < time() ) {
			return null;
		}
		$r = self::get( $s['reader_id'] );
		if ( ! $r || 'active' !== $r['status'] ) {
			return null;
		}
		self::$reader = $r;
		return $r;
	}

	/* ---------- password reset ---------- */

	/** How long a password link works. */
	const LINK_DAYS = 7;

	/**
	 * Makes a one-time link that lets the reader choose a password (for a new account)
	 * or a new password (to reset it). Nothing is emailed: the site owner copies the link
	 * and sends it however they like. Making a new link cancels the previous one.
	 */
	public static function make_link( $id ) {
		global $wpdb;
		if ( ! self::get( $id ) ) {
			return '';
		}
		$token = bin2hex( random_bytes( 24 ) );
		$wpdb->update(
			self::table( 'readers' ),
			array(
				'reset_hash' => hash( 'sha256', $token ),
				'reset_exp'  => time() + self::LINK_DAYS * DAY_IN_SECONDS,
			),
			array( 'id' => (int) $id )
		);
		return add_query_arg( 'nbreset', $token, NB_Reader::page_url() );
	}

	public static function reader_for_reset( $token ) {
		global $wpdb;
		if ( ! preg_match( '/^[a-f0-9]{48}$/', (string) $token ) ) {
			return null;
		}
		$r = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table( 'readers' ) . ' WHERE reset_hash = %s', hash( 'sha256', $token ) ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		return ( $r && (int) $r['reset_exp'] >= time() && 'active' === $r['status'] ) ? $r : null;
	}

	/* ---------- reader data ---------- */

	public static function get_data( $id ) {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT rev, data, updated FROM ' . self::table( 'reader_data' ) . ' WHERE reader_id = %d', $id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		if ( ! $row ) {
			return array( 'rev' => 0, 'doc' => null, 'updated' => null );
		}
		return array( 'rev' => (int) $row['rev'], 'doc' => json_decode( $row['data'], true ), 'updated' => $row['updated'] );
	}

	/* ---------- REST ---------- */

	public static function routes() {
		$r = function ( $path, $methods, $cb ) {
			register_rest_route(
				self::NS,
				$path,
				array(
					'methods'             => $methods,
					'callback'            => array( __CLASS__, $cb ),
					'permission_callback' => array( __CLASS__, 'guard' ),
				)
			);
		};
		$r( '/state', 'GET', 'api_state' );
		$r( '/register', 'POST', 'api_register' );
		$r( '/login', 'POST', 'api_login' );
		$r( '/logout', 'POST', 'api_logout' );
		$r( '/data', 'GET', 'api_get_data' );
		$r( '/data', 'PUT', 'api_put_data' );
		$r( '/account', 'POST', 'api_account' );
		$r( '/password', 'POST', 'api_password' );
		$r( '/reset', 'GET', 'api_reset_check' );
		$r( '/reset', 'POST', 'api_reset' );
		$r( '/delete', 'POST', 'api_delete' );
	}

	/** Every route: accounts must be switched on; changes need the X-NB-Request header. */
	public static function guard( WP_REST_Request $req ) {
		if ( ! self::enabled() && '/' . self::NS . '/state' !== $req->get_route() ) {
			return new WP_Error( 'nb_off', 'Reader accounts are switched off on this site.', array( 'status' => 403 ) );
		}
		if ( 'GET' !== $req->get_method() && '1' !== $req->get_header( 'x_nb_request' ) ) {
			return new WP_Error( 'nb_csrf', 'Missing request header.', array( 'status' => 403 ) );
		}
		return true;
	}

	private static function need_reader() {
		$r = self::current();
		return $r ? $r : new WP_Error( 'nb_signed_out', 'Please sign in again.', array( 'status' => 401 ) );
	}

	private static function throttle_key( $username ) {
		$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '' ) );
		return 'nb_fail_' . md5( self::clean_username( $username ) . '|' . $ip );
	}

	private static function throttled( $username ) {
		return (int) get_transient( self::throttle_key( $username ) ) >= 8;
	}

	private static function fail( $username ) {
		$k = self::throttle_key( $username );
		set_transient( $k, (int) get_transient( $k ) + 1, 15 * MINUTE_IN_SECONDS );
	}

	public static function api_state() {
		return array(
			'accounts' => self::enabled(),
			'signups'  => self::signups_open(),
			'reader'   => self::public_reader( self::current() ),
		);
	}

	public static function api_register( WP_REST_Request $req ) {
		if ( ! self::signups_open() ) {
			return new WP_Error( 'nb_closed', 'New accounts are not open on this site. Ask the site owner to add you.', array( 'status' => 403 ) );
		}
		$pass = (string) $req->get_param( 'password' );
		if ( strlen( $pass ) < self::MIN_PASS ) {
			return new WP_Error( 'nb_pass', sprintf( 'Use at least %d characters for the password.', self::MIN_PASS ), array( 'status' => 400 ) );
		}
		$id = self::create( $req->get_param( 'name' ), $req->get_param( 'username' ), $pass );
		if ( is_wp_error( $id ) ) {
			return $id;
		}
		self::start_session( $id );
		return array( 'reader' => self::public_reader( self::get( $id ) ) );
	}

	public static function api_login( WP_REST_Request $req ) {
		$username = (string) $req->get_param( 'username' );
		if ( self::throttled( $username ) ) {
			return new WP_Error( 'nb_slow', 'Too many tries. Wait 15 minutes, or ask the site owner for a password link.', array( 'status' => 429 ) );
		}
		$r = self::get_by_username( $username );
		if ( ! $r || '' === $r['pass'] || ! wp_check_password( (string) $req->get_param( 'password' ), $r['pass'] ) ) {
			self::fail( $username );
			return new WP_Error( 'nb_login', 'That username and password don\'t match.', array( 'status' => 401 ) );
		}
		if ( 'active' !== $r['status'] ) {
			return new WP_Error( 'nb_disabled', 'This account has been switched off by the site owner.', array( 'status' => 403 ) );
		}
		delete_transient( self::throttle_key( $username ) );
		self::start_session( $r['id'] );
		return array( 'reader' => self::public_reader( $r ) );
	}

	public static function api_logout() {
		self::end_session();
		return array( 'ok' => true );
	}

	public static function api_get_data() {
		$r = self::need_reader();
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		return self::get_data( $r['id'] );
	}

	/** Saves the reader's notes. A stale rev gets 409 with the newer copy to merge. */
	public static function api_put_data( WP_REST_Request $req ) {
		global $wpdb;
		$r = self::need_reader();
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		$doc = $req->get_param( 'doc' );
		if ( ! is_array( $doc ) ) {
			return new WP_Error( 'nb_doc', 'Nothing to save.', array( 'status' => 400 ) );
		}
		$json = wp_json_encode( $doc );
		if ( false === $json || strlen( $json ) > self::MAX_DOC ) {
			return new WP_Error( 'nb_big', 'Your notes are too large to save.', array( 'status' => 413 ) );
		}
		$base = (int) $req->get_param( 'rev' );
		$t    = self::table( 'reader_data' );
		$now  = current_time( 'mysql', true );
		if ( 0 === $base ) {
			// First save: only succeeds if nothing is stored yet.
			$ok = $wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO $t (reader_id, rev, updated, data) VALUES (%d, 1, %s, %s)", $r['id'], $now, $json ) ); // phpcs:ignore WordPress.DB.PreparedSQL
		} else {
			$ok = $wpdb->query( $wpdb->prepare( "UPDATE $t SET rev = rev + 1, updated = %s, data = %s WHERE reader_id = %d AND rev = %d", $now, $json, $r['id'], $base ) ); // phpcs:ignore WordPress.DB.PreparedSQL
		}
		if ( ! $ok ) {
			$cur = self::get_data( $r['id'] );
			return new WP_REST_Response( array_merge( array( 'code' => 'nb_conflict' ), $cur ), 409 );
		}
		return array( 'rev' => $base + 1 );
	}

	public static function api_account( WP_REST_Request $req ) {
		global $wpdb;
		$r = self::need_reader();
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		$name = trim( sanitize_text_field( (string) $req->get_param( 'name' ) ) );
		if ( '' !== $name ) {
			$wpdb->update( self::table( 'readers' ), array( 'name' => mb_substr( $name, 0, 100 ) ), array( 'id' => (int) $r['id'] ) );
		}
		return array( 'reader' => self::public_reader( self::get( $r['id'] ) ) );
	}

	public static function api_password( WP_REST_Request $req ) {
		$r = self::need_reader();
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		if ( ! wp_check_password( (string) $req->get_param( 'current' ), $r['pass'] ) ) {
			return new WP_Error( 'nb_login', 'Your current password isn\'t right.', array( 'status' => 401 ) );
		}
		$new = (string) $req->get_param( 'password' );
		if ( strlen( $new ) < self::MIN_PASS ) {
			return new WP_Error( 'nb_pass', sprintf( 'Use at least %d characters for the password.', self::MIN_PASS ), array( 'status' => 400 ) );
		}
		self::set_password( $r['id'], $new );
		// Sign out other devices, keep this one.
		self::end_sessions( $r['id'] );
		self::start_session( $r['id'] );
		return array( 'ok' => true );
	}

	public static function api_reset_check( WP_REST_Request $req ) {
		$r = self::reader_for_reset( $req->get_param( 'token' ) );
		return $r ? array( 'ok' => true, 'username' => $r['username'], 'name' => $r['name'], 'new' => '' === $r['pass'] ) : new WP_Error( 'nb_reset', 'This link has expired or was already used. Ask the site owner for a new one.', array( 'status' => 400 ) );
	}

	public static function api_reset( WP_REST_Request $req ) {
		$r = self::reader_for_reset( $req->get_param( 'token' ) );
		if ( ! $r ) {
			return new WP_Error( 'nb_reset', 'This link has expired or was already used. Ask the site owner for a new one.', array( 'status' => 400 ) );
		}
		$new = (string) $req->get_param( 'password' );
		if ( strlen( $new ) < self::MIN_PASS ) {
			return new WP_Error( 'nb_pass', sprintf( 'Use at least %d characters for the password.', self::MIN_PASS ), array( 'status' => 400 ) );
		}
		self::set_password( $r['id'], $new );
		self::end_sessions( $r['id'] );
		self::start_session( $r['id'] );
		return array( 'reader' => self::public_reader( $r ) );
	}

	public static function api_delete( WP_REST_Request $req ) {
		$r = self::need_reader();
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		if ( ! wp_check_password( (string) $req->get_param( 'password' ), $r['pass'] ) ) {
			return new WP_Error( 'nb_login', 'That password isn\'t right.', array( 'status' => 401 ) );
		}
		self::end_session();
		self::delete( $r['id'] );
		return array( 'ok' => true );
	}
}
