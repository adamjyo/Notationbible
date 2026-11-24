<?php
/**
 * Settings → Notation Bible: reader address, starting passage and updates.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class NB_Admin {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register' ) );
		add_action( 'admin_post_nb_check_updates', array( __CLASS__, 'handle_check' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( NB_FILE ), array( __CLASS__, 'action_links' ) );
	}

	public static function menu() {
		add_menu_page( 'Notation Bible', 'Notation Bible', 'manage_options', 'notation-bible', array( __CLASS__, 'page' ), 'dashicons-book-alt', 58 );
		add_submenu_page( 'notation-bible', 'Notation Bible settings', 'Settings', 'manage_options', 'notation-bible', array( __CLASS__, 'page' ) );
	}

	public static function action_links( $links ) {
		array_unshift(
			$links,
			'<a href="' . esc_url( admin_url( 'admin.php?page=notation-bible' ) ) . '">' . esc_html__( 'Settings', 'notation-bible' ) . '</a>',
			'<a href="' . esc_url( NB_Reader::page_url() ) . '" target="_blank" rel="noopener">' . esc_html__( 'Open Bible', 'notation-bible' ) . '</a>'
		);
		return $links;
	}

	public static function register() {
		register_setting(
			'nb_settings_group',
			'nb_settings',
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize' ),
			)
		);
	}

	public static function sanitize( $in ) {
		$old = NB_Reader::settings();
		$in  = is_array( $in ) ? $in : array();
		$form = ! empty( $in['_form'] );
		$out  = array(
			'accounts'    => $form ? (int) ! empty( $in['accounts'] ) : (int) ( $in['accounts'] ?? $old['accounts'] ),
			'signups'     => $form ? (int) ! empty( $in['signups'] ) : (int) ( $in['signups'] ?? $old['signups'] ),
			'delete_data' => $form ? (int) ! empty( $in['delete_data'] ) : (int) ( $in['delete_data'] ?? $old['delete_data'] ),
			'home'        => $form ? (int) ! empty( $in['home'] ) : (int) ( $in['home'] ?? $old['home'] ),
			'slug'        => sanitize_title( $in['slug'] ?? $old['slug'] ),
			'start' => sanitize_text_field( $in['start'] ?? $old['start'] ),
			// Leaving the token box empty keeps the saved token; tick "remove" to clear it.
			'token' => ! empty( $in['token_clear'] ) ? '' : ( '' !== trim( (string) ( $in['token'] ?? '' ) ) ? sanitize_text_field( $in['token'] ) : $old['token'] ),
		);
		if ( '' === $out['slug'] ) {
			$out['slug'] = 'bible';
		}
		if ( $out['slug'] !== $old['slug'] ) {
			update_option( 'nb_flush_rewrite', 1 );
		}
		if ( $out['token'] !== $old['token'] ) {
			delete_site_transient( NB_Updater::CACHE_KEY );
		}
		// WordPress can run this callback twice on the first save; only the real form post carries _form.
		if ( $form ) {
			NB_Updater::set_auto_update( ! empty( $in['auto_update'] ) );
		}
		return $out;
	}

	public static function handle_check() {
		if ( ! current_user_can( 'update_plugins' ) ) {
			wp_die( esc_html__( 'You are not allowed to update plugins.', 'notation-bible' ) );
		}
		check_admin_referer( 'nb_check_updates' );
		NB_Updater::check_now();
		wp_safe_redirect( admin_url( 'admin.php?page=notation-bible&nb_checked=1' ) );
		exit;
	}

	public static function page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$s       = NB_Reader::settings();
		$release = NB_Updater::latest();
		$last    = get_option( 'nb_last_check', array() );
		$newer   = $release && version_compare( $release['version'], NB_VERSION, '>' );
		$file    = NB_Updater::basename();
		?>
		<div class="wrap">
			<h1>Notation Bible</h1>
			<?php if ( isset( $_GET['nb_checked'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification ?>
				<div class="notice notice-info is-dismissible"><p><?php echo $newer ? esc_html( sprintf( 'Version %s is available.', $release['version'] ) ) : esc_html__( 'Checked GitHub for updates.', 'notation-bible' ); ?></p></div>
			<?php endif; ?>

			<p>
				<a class="button button-primary" href="<?php echo esc_url( NB_Reader::page_url() ); ?>" target="_blank" rel="noopener">Open the Bible</a>
				&nbsp;<code><?php echo esc_html( NB_Reader::page_url() ); ?></code>
			</p>
			<p>Put the reader inside any page or post with <code>[notation_bible]</code>, or open it at a passage with <code>[notation_bible ref="John 3:16" height="80vh"]</code>.</p>

			<h2>Updates</h2>
			<table class="form-table" role="presentation">
				<tr><th scope="row">Installed version</th><td><?php echo esc_html( NB_VERSION ); ?></td></tr>
				<tr><th scope="row">Latest release</th><td>
					<?php
					if ( $release ) {
						echo esc_html( $release['version'] );
						if ( $release['url'] ) {
							echo ' &middot; <a href="' . esc_url( $release['url'] ) . '" target="_blank" rel="noopener">release notes</a>';
						}
					} else {
						echo esc_html( ! empty( $last['error'] ) ? $last['error'] : 'Not checked yet.' );
					}
					?>
				</td></tr>
				<tr><th scope="row">Last checked</th><td><?php echo ! empty( $last['time'] ) ? esc_html( sprintf( '%s ago', human_time_diff( (int) $last['time'] ) ) ) : '—'; ?></td></tr>
			</table>
			<p>
				<?php if ( $newer && current_user_can( 'update_plugins' ) ) : ?>
					<a class="button button-primary" href="<?php echo esc_url( wp_nonce_url( self_admin_url( 'update.php?action=upgrade-plugin&plugin=' . rawurlencode( $file ) ), 'upgrade-plugin_' . $file ) ); ?>">Update to <?php echo esc_html( $release['version'] ); ?> now</a>
				<?php endif; ?>
				<?php if ( current_user_can( 'update_plugins' ) ) : ?>
				<a class="button" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=nb_check_updates' ), 'nb_check_updates' ) ); ?>">Check for updates now</a>
				<?php endif; ?>
			</p>

			<form method="post" action="options.php">
				<?php settings_fields( 'nb_settings_group' ); ?>
				<input type="hidden" name="nb_settings[_form]" value="1">
				<h2>Settings</h2>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row">Home page</th>
						<td><label><input name="nb_settings[home]" type="checkbox" value="1" <?php checked( NB_Reader::is_home_page() ); ?>> Show the Bible as this site's home page (<code><?php echo esc_html( home_url( '/' ) ); ?></code>)</label>
						<p class="description">When on, the address below sends visitors to the home page. When off, the Bible is only at the address below.</p></td>
					</tr>
					<tr>
						<th scope="row"><label for="nb-slug">Reader address</label></th>
						<td><code><?php echo esc_html( trailingslashit( home_url() ) ); ?></code><input id="nb-slug" name="nb_settings[slug]" type="text" class="regular-text" style="width:12em" value="<?php echo esc_attr( $s['slug'] ); ?>"></td>
					</tr>
					<tr>
						<th scope="row"><label for="nb-start">First passage for new readers</label></th>
						<td><input id="nb-start" name="nb_settings[start]" type="text" class="regular-text" value="<?php echo esc_attr( $s['start'] ); ?>"><p class="description">For example John 1 or Psalm 23. Returning readers open where they left off.</p></td>
					</tr>
					<tr>
						<th scope="row">Reader accounts</th>
						<td>
							<label><input name="nb_settings[accounts]" type="checkbox" value="1" <?php checked( ! empty( $s['accounts'] ) ); ?>> Readers can sign in with a username and password to save their highlights, notes and NoteTrees across devices</label><br>
							<label><input name="nb_settings[signups]" type="checkbox" value="1" <?php checked( ! empty( $s['signups'] ) ); ?>> Anyone can create an account (when off, only readers you add on the <a href="<?php echo esc_url( admin_url( 'admin.php?page=notation-bible-readers' ) ); ?>">Readers</a> page can sign in)</label>
							<p class="description">Reader accounts are separate from WordPress users: readers never get a WordPress login. Without an account, notes stay in the reader's own browser.</p>
						</td>
					</tr>
					<tr>
						<th scope="row">Automatic updates</th>
						<td><label><input name="nb_settings[auto_update]" type="checkbox" value="1" <?php checked( NB_Updater::auto_update_enabled() ); ?>> Install new versions automatically</label><p class="description">WordPress checks twice a day. This is the same switch as “Enable auto-updates” on the Plugins screen.</p></td>
					</tr>
					<tr>
						<th scope="row"><label for="nb-token">GitHub token</label></th>
						<td><input id="nb-token" name="nb_settings[token]" type="password" class="regular-text" autocomplete="off" placeholder="<?php echo $s['token'] ? esc_attr__( 'Saved — leave empty to keep', 'notation-bible' ) : ''; ?>">
						<?php if ( $s['token'] ) : ?><label><input name="nb_settings[token_clear]" type="checkbox" value="1"> Remove</label><?php endif; ?>
						<p class="description">Only needed if the GitHub repository is made private. Leave empty for the public repository.</p></td>
					</tr>
					<tr>
						<th scope="row">When the plugin is deleted</th>
						<td><label><input name="nb_settings[delete_data]" type="checkbox" value="1" <?php checked( ! empty( $s['delete_data'] ) ); ?>> Also delete all reader accounts and their notes</label><p class="description">Left off, reader accounts survive deleting and reinstalling the plugin.</p></td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}
}
