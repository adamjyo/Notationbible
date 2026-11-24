<?php
/**
 * Serves the reader as a full page at /<slug>/ and embeds it with [notation_bible].
 *
 * The reader is the same static app as the web version (app/index.html, app.js,
 * books.js, styles.css and app/data/). The page is printed without the theme so
 * theme CSS cannot clash with it; the Bible data is fetched straight from the
 * plugin folder as static files.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class NB_Reader {

	const QUERY_VAR = 'notation_bible';

	public static function init() {
		add_action( 'init', array( __CLASS__, 'add_rewrite' ) );
		add_filter( 'query_vars', array( __CLASS__, 'query_vars' ) );
		add_action( 'template_redirect', array( __CLASS__, 'maybe_serve' ), 0 );
		add_shortcode( 'notation_bible', array( __CLASS__, 'shortcode' ) );
	}

	/** Saved settings merged with defaults. */
	public static function settings() {
		$saved = get_option( 'nb_settings', array() );
		return wp_parse_args(
			is_array( $saved ) ? $saved : array(),
			array(
				'slug'  => 'bible',
				'start' => 'John 1',
				'token' => '',
			)
		);
	}

	public static function slug() {
		$slug = sanitize_title( self::settings()['slug'] );
		return '' === $slug ? 'bible' : $slug;
	}

	/** Public URL of the full-page reader. */
	public static function page_url() {
		if ( get_option( 'permalink_structure' ) ) {
			return home_url( user_trailingslashit( self::slug() ) );
		}
		return add_query_arg( self::QUERY_VAR, '1', home_url( '/' ) );
	}

	public static function add_rewrite() {
		add_rewrite_rule( '^' . preg_quote( self::slug(), '/' ) . '/?$', 'index.php?' . self::QUERY_VAR . '=1', 'top' );
		if ( get_option( 'nb_flush_rewrite' ) ) {
			delete_option( 'nb_flush_rewrite' );
			flush_rewrite_rules( false );
		}
	}

	public static function query_vars( $vars ) {
		$vars[] = self::QUERY_VAR;
		return $vars;
	}

	public static function activate() {
		self::add_rewrite();
		flush_rewrite_rules( false );
		// Turn on automatic updates the first time the plugin is activated.
		if ( ! get_option( 'nb_auto_update_set' ) ) {
			NB_Updater::set_auto_update( true );
			update_option( 'nb_auto_update_set', 1 );
		}
	}

	public static function deactivate() {
		flush_rewrite_rules( false );
	}

	public static function maybe_serve() {
		if ( ! get_query_var( self::QUERY_VAR ) ) {
			return;
		}
		status_header( 200 );
		nocache_headers();
		header( 'Content-Type: text/html; charset=utf-8' );
		echo self::page_html(); // phpcs:ignore WordPress.Security.EscapeOutput -- full document built from the bundled app.
		exit;
	}

	/** The app's index.html with asset URLs pointed at the plugin folder. */
	public static function page_html() {
		$html = file_get_contents( NB_DIR . 'app/index.html' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		if ( false === $html ) {
			return '<!doctype html><title>Notation Bible</title><p>Notation Bible could not find its files. Reinstall the plugin.</p>';
		}
		$base = NB_URL . 'app/';
		$ver  = rawurlencode( NB_VERSION );
		$cfg  = array( 'start' => self::settings()['start'] );

		$html = str_replace( 'href="styles.css"', 'href="' . esc_url( $base . 'styles.css?ver=' . $ver ) . '"', $html );
		$html = str_replace( 'src="app.js"', 'src="' . esc_url( $base . 'app.js?ver=' . $ver ) . '"', $html );
		$boot = '<script>window.NB_BASE=' . wp_json_encode( $base ) . ';window.NB_CONFIG=' . wp_json_encode( $cfg ) . ';</script>' . "\n"
			. '<script src="' . esc_url( $base . 'books.js?ver=' . $ver ) . '"></script>';
		$html = str_replace( '<script src="books.js"></script>', $boot, $html );

		$title = get_bloginfo( 'name' );
		if ( $title ) {
			$html = preg_replace( '#<title>(.*?)</title>#', '<title>$1 · ' . esc_html( $title ) . '</title>', $html, 1 );
		}
		return $html;
	}

	/**
	 * [notation_bible ref="John 3:16" height="80vh"]
	 * Embeds the full reader in an iframe, which keeps the theme's CSS and the reader apart.
	 */
	public static function shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'ref'    => '',
				'height' => '80vh',
			),
			$atts,
			'notation_bible'
		);
		$src = self::page_url();
		if ( '' !== $atts['ref'] ) {
			$src = add_query_arg( 'ref', rawurlencode( $atts['ref'] ), $src );
		}
		$height = preg_match( '/^\d+(\.\d+)?(px|vh|em|rem|%)$/', $atts['height'] ) ? $atts['height'] : '80vh';
		return sprintf(
			'<iframe class="notation-bible-embed" src="%s" title="%s" style="width:100%%;height:%s;border:0;border-radius:12px;display:block" loading="lazy" allow="microphone; clipboard-write"></iframe>',
			esc_url( $src ),
			esc_attr__( 'Notation Bible', 'notation-bible' ),
			esc_attr( $height )
		);
	}
}
