<?php
/**
 * Keeps Notation Bible up to date from GitHub releases.
 *
 * How it works:
 * - The plugin header has "Update URI: https://github.com/adamjyo/notationbible", so
 *   WordPress asks this class (through the update_plugins_github.com filter) instead
 *   of WordPress.org whether a newer version exists.
 * - This class reads the latest release of the repository from the GitHub API and
 *   offers its notation-bible.zip asset as the update package.
 * - WordPress then handles the rest: the "update available" notice, the Update now
 *   button, and automatic background updates (turned on when the plugin is first
 *   activated; it can be switched off on the Plugins screen or the settings page).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class NB_Updater {

	const SLUG      = 'notation-bible';
	const ASSET     = 'notation-bible.zip';
	const CACHE_KEY = 'nb_latest_release';
	const CACHE_TTL = 6 * HOUR_IN_SECONDS;

	public static function init() {
		add_filter( 'update_plugins_github.com', array( __CLASS__, 'check' ), 10, 3 );
		add_filter( 'plugins_api', array( __CLASS__, 'details' ), 20, 3 );
		add_filter( 'upgrader_source_selection', array( __CLASS__, 'fix_folder' ), 10, 4 );
		add_filter( 'http_request_args', array( __CLASS__, 'auth_download' ), 10, 2 );
		add_action( 'upgrader_process_complete', array( __CLASS__, 'after_upgrade' ), 10, 2 );
		add_filter( 'site_transient_update_plugins', array( __CLASS__, 'fallback' ) );
	}

	/**
	 * WordPress skips every Update URI check when WordPress.org cannot be reached
	 * (firewalled hosts, outages). In that case our entry is missing from the list of
	 * updates, so add it from the GitHub release ourselves.
	 */
	public static function fallback( $value ) {
		$file = self::basename();
		if ( ! is_object( $value ) || isset( $value->response[ $file ] ) || isset( $value->no_update[ $file ] ) ) {
			return $value;
		}
		$release = self::latest();
		if ( ! $release ) {
			return $value;
		}
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$item = (object) self::check( false, get_plugin_data( NB_FILE, false, false ), $file );
		if ( version_compare( $release['version'], NB_VERSION, '>' ) ) {
			$value->response[ $file ] = $item;
		} else {
			$value->no_update[ $file ] = $item;
		}
		return $value;
	}

	public static function basename() {
		return plugin_basename( NB_FILE );
	}

	/** Optional GitHub token, only needed if the repository is made private. */
	private static function token() {
		$token = NB_Reader::settings()['token'];
		return is_string( $token ) ? trim( $token ) : '';
	}

	/**
	 * Latest release as array( version, package, url, notes, published ), or null.
	 * Cached for six hours; a failed request is cached for 30 minutes so GitHub's rate
	 * limit is never hammered.
	 */
	public static function latest( $force = false ) {
		if ( ! $force ) {
			$cached = get_site_transient( self::CACHE_KEY );
			if ( is_array( $cached ) ) {
				return empty( $cached['version'] ) ? null : $cached;
			}
		}

		$headers = array(
			'Accept'     => 'application/vnd.github+json',
			'User-Agent' => 'NotationBible-WordPress/' . NB_VERSION,
		);
		if ( self::token() ) {
			$headers['Authorization'] = 'Bearer ' . self::token();
		}
		$res = wp_remote_get(
			'https://api.github.com/repos/' . NB_REPO . '/releases/latest',
			array(
				'timeout' => 15,
				'headers' => $headers,
			)
		);

		$release = null;
		if ( ! is_wp_error( $res ) && 200 === (int) wp_remote_retrieve_response_code( $res ) ) {
			$body = json_decode( wp_remote_retrieve_body( $res ), true );
			if ( is_array( $body ) && ! empty( $body['tag_name'] ) ) {
				$package = '';
				foreach ( (array) ( $body['assets'] ?? array() ) as $asset ) {
					if ( isset( $asset['name'] ) && self::ASSET === $asset['name'] ) {
						// With a token, download through the API (works for private repos).
						$package = self::token() ? $asset['url'] : $asset['browser_download_url'];
					}
				}
				if ( $package ) {
					$release = array(
						'version'   => ltrim( (string) $body['tag_name'], 'vV' ),
						'package'   => $package,
						'url'       => (string) ( $body['html_url'] ?? '' ),
						'notes'     => (string) ( $body['body'] ?? '' ),
						'published' => (string) ( $body['published_at'] ?? '' ),
					);
				}
			}
		}

		update_option( 'nb_last_check', array( 'time' => time(), 'ok' => (bool) $release, 'error' => self::error_text( $res ) ), false );
		set_site_transient( self::CACHE_KEY, $release ? $release : array(), $release ? self::CACHE_TTL : 30 * MINUTE_IN_SECONDS );
		return $release;
	}

	private static function error_text( $res ) {
		if ( is_wp_error( $res ) ) {
			return $res->get_error_message();
		}
		$code = (int) wp_remote_retrieve_response_code( $res );
		if ( 200 === $code ) {
			return '';
		}
		if ( 404 === $code ) {
			return 'No published release was found on GitHub.';
		}
		return 'GitHub answered HTTP ' . $code . '.';
	}

	/** update_plugins_github.com: tell WordPress about the newest release. */
	public static function check( $update, $plugin_data, $plugin_file ) {
		if ( self::basename() !== $plugin_file ) {
			return $update;
		}
		// "Check again" on Dashboard → Updates skips the cache.
		$force   = is_admin() && isset( $_GET['force-check'] ); // phpcs:ignore WordPress.Security.NonceVerification
		$release = self::latest( $force );
		if ( ! $release ) {
			return $update;
		}
		return array(
			'id'           => $plugin_data['UpdateURI'],
			'slug'         => self::SLUG,
			'plugin'       => $plugin_file,
			'version'      => $release['version'],
			'new_version'  => $release['version'],
			'url'          => $release['url'],
			'package'      => $release['package'],
			'requires'     => $plugin_data['RequiresWP'] ?? '5.8',
			'requires_php' => $plugin_data['RequiresPHP'] ?? '7.4',
			'icons'        => array(),
			'banners'      => array(),
		);
	}

	/** plugins_api: the "View details" window on the Plugins and Updates screens. */
	public static function details( $result, $action, $args ) {
		if ( 'plugin_information' !== $action || empty( $args->slug ) || self::SLUG !== $args->slug ) {
			return $result;
		}
		$release = self::latest();
		$notes   = $release ? $release['notes'] : '';
		return (object) array(
			'name'          => 'Notation Bible',
			'slug'          => self::SLUG,
			'version'       => $release ? $release['version'] : NB_VERSION,
			'author'        => 'Notation Bible',
			'homepage'      => 'https://github.com/' . NB_REPO,
			'requires'      => '5.8',
			'requires_php'  => '7.4',
			'last_updated'  => $release ? $release['published'] : '',
			'download_link' => $release ? $release['package'] : '',
			'sections'      => array(
				'description' => '<p>The complete Berean Standard Bible with Strong\'s numbers, Greek and Hebrew interlinear, footnotes, cross-references, commentaries, highlighting, notes and NoteTrees.</p>',
				'changelog'   => $notes ? wpautop( esc_html( $notes ) ) : '<p>See the release page on GitHub.</p>',
			),
		);
	}

	/** Make sure the unpacked update lands in wp-content/plugins/notation-bible/. */
	public static function fix_folder( $source, $remote_source, $upgrader, $hook_extra = array() ) {
		if ( empty( $hook_extra['plugin'] ) || self::basename() !== $hook_extra['plugin'] ) {
			return $source;
		}
		global $wp_filesystem;
		$want = trailingslashit( $remote_source ) . self::SLUG . '/';
		if ( trailingslashit( $source ) === $want ) {
			return $source;
		}
		if ( $wp_filesystem && $wp_filesystem->move( $source, $want, true ) ) {
			return $want;
		}
		return new WP_Error( 'nb_folder', 'Notation Bible: could not prepare the update folder.' );
	}

	/** With a token, GitHub asset downloads need these headers. */
	public static function auth_download( $args, $url ) {
		$token = self::token();
		if ( $token && 0 === strpos( $url, 'https://api.github.com/repos/' . NB_REPO . '/releases/assets/' ) ) {
			$args['headers']['Authorization'] = 'Bearer ' . $token;
			$args['headers']['Accept']        = 'application/octet-stream';
		}
		return $args;
	}

	public static function after_upgrade( $upgrader, $options ) {
		if ( ( $options['type'] ?? '' ) === 'plugin' && in_array( self::basename(), (array) ( $options['plugins'] ?? array() ), true ) ) {
			delete_site_transient( self::CACHE_KEY );
			update_option( 'nb_flush_rewrite', 1 );
		}
	}

	/** Force a fresh check and let WordPress rebuild its list of updates. */
	public static function check_now() {
		delete_site_transient( self::CACHE_KEY );
		delete_site_transient( 'update_plugins' );
		if ( ! function_exists( 'wp_update_plugins' ) ) {
			require_once ABSPATH . 'wp-includes/update.php';
		}
		wp_update_plugins();
		return self::latest();
	}

	public static function auto_update_enabled() {
		return in_array( self::basename(), (array) get_site_option( 'auto_update_plugins', array() ), true );
	}

	/** Uses the same switch as the Plugins screen's "Enable auto-updates" link. */
	public static function set_auto_update( $on ) {
		$list = (array) get_site_option( 'auto_update_plugins', array() );
		$list = array_values( array_diff( $list, array( self::basename() ) ) );
		if ( $on ) {
			$list[] = self::basename();
		}
		update_site_option( 'auto_update_plugins', $list );
	}
}
