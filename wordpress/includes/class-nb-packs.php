<?php
/**
 * Notation Bible → Study resources: commentary packs.
 *
 * The big commentaries are not inside the plugin (they would make every update a very large
 * download). Each is a zip on the GitHub pre-release "resources"; the site owner installs the
 * ones they want, once. A pack unzips to wp-content/uploads/notation-bible/packs/<id>/ as
 * one JSON file per Bible book plus meta.json, and the reader loads the files from there.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class NB_Packs {

	const OPTION  = 'nb_packs';
	const CATALOG = 'nb_packs_catalog';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ), 20 );
		add_action( 'admin_post_nb_pack', array( __CLASS__, 'handle_post' ) );
		add_action( 'wp_ajax_nb_pack', array( __CLASS__, 'handle_ajax' ) );
	}

	public static function menu() {
		add_submenu_page( 'notation-bible', 'Study resources', 'Study resources', 'manage_options', 'notation-bible-resources', array( __CLASS__, 'page' ) );
	}

	/** Where the packs' files live. */
	private static function dir( $id = '' ) {
		$u = wp_upload_dir( null, false );
		return trailingslashit( $u['basedir'] ) . 'notation-bible/packs' . ( $id ? '/' . $id : '' );
	}

	private static function url( $id ) {
		$u = wp_upload_dir( null, false );
		return set_url_scheme( trailingslashit( $u['baseurl'] ) . 'notation-bible/packs/' . $id );
	}

	private static function asset( $name ) {
		return 'https://github.com/' . NB_REPO . '/releases/download/resources/' . $name;
	}

	/** Installed packs: id => meta (from the pack's meta.json). */
	public static function installed() {
		$p = get_option( self::OPTION, array() );
		return is_array( $p ) ? $p : array();
	}

	/** The packs on offer, from packs.json on the "resources" pre-release (cached 12 hours). */
	public static function catalog( $fresh = false ) {
		$c = get_transient( self::CATALOG );
		if ( $fresh || ! is_array( $c ) ) {
			$r = wp_remote_get( self::asset( 'packs.json' ), array( 'timeout' => 20, 'headers' => array( 'User-Agent' => 'NotationBible/' . NB_VERSION ) ) );
			$c = is_wp_error( $r ) || 200 !== wp_remote_retrieve_response_code( $r ) ? null : json_decode( wp_remote_retrieve_body( $r ), true );
			if ( is_array( $c ) ) {
				set_transient( self::CATALOG, $c, 12 * HOUR_IN_SECONDS );
			} else {
				return array();
			}
		}
		$out = array();
		foreach ( $c as $p ) {
			if ( is_array( $p ) && ! empty( $p['id'] ) && preg_match( '/^[a-z0-9-]+$/', $p['id'] ) ) {
				$out[ $p['id'] ] = $p;
			}
		}
		return $out;
	}

	/** What the reader needs to know about the installed packs (passed as NB_CONFIG.packs). */
	public static function for_reader() {
		$out = array();
		foreach ( self::installed() as $id => $m ) {
			if ( ! is_dir( self::dir( $id ) ) ) {
				continue;
			}
			$row = array( 'url' => self::url( $id ) );
			foreach ( array( 'id', 'name', 'short', 'about', 'license', 'credit', 'books' ) as $k ) {
				if ( isset( $m[ $k ] ) ) {
					$row[ $k ] = $m[ $k ];
				}
			}
			$out[] = $row;
		}
		// the order the catalogue lists them in
		$order = array_keys( self::catalog() );
		usort(
			$out,
			function ( $a, $b ) use ( $order ) {
				$x = array_search( $a['id'], $order, true );
				$y = array_search( $b['id'], $order, true );
				return ( false === $x ? 99 : $x ) - ( false === $y ? 99 : $y );
			}
		);
		return $out;
	}

	/** Download and unpack one pack. Returns true or a WP_Error. */
	public static function install( $id ) {
		$cat = self::catalog();
		if ( ! isset( $cat[ $id ] ) ) {
			return new WP_Error( 'nb_pack', 'That pack is not in the catalogue.' );
		}
		if ( function_exists( 'set_time_limit' ) ) {
			@set_time_limit( 300 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
		}
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$tmp = download_url( self::asset( $id . '.zip' ), 280 );
		if ( is_wp_error( $tmp ) ) {
			return $tmp;
		}
		global $wp_filesystem;
		if ( ! WP_Filesystem() ) {
			wp_delete_file( $tmp );
			return new WP_Error( 'nb_pack', 'WordPress cannot write to the uploads folder.' );
		}
		$root = self::dir();
		wp_mkdir_p( $root );
		$stage = $root . '/.' . $id . '-' . wp_generate_password( 6, false );
		$res   = unzip_file( $tmp, $stage );
		wp_delete_file( $tmp );
		if ( is_wp_error( $res ) ) {
			$wp_filesystem->delete( $stage, true );
			return $res;
		}
		$src  = $stage . '/' . $id;
		$meta = is_readable( $src . '/meta.json' ) ? json_decode( (string) file_get_contents( $src . '/meta.json' ), true ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions
		if ( ! is_array( $meta ) || ( $meta['id'] ?? '' ) !== $id ) {
			$wp_filesystem->delete( $stage, true );
			return new WP_Error( 'nb_pack', 'The download was not a Notation Bible pack.' );
		}
		// keep only the pack's own JSON files
		foreach ( (array) scandir( $src ) as $f ) {
			if ( '.' !== $f && '..' !== $f && ! preg_match( '/^[a-z0-9-]+\.json$/', $f ) ) {
				$wp_filesystem->delete( $src . '/' . $f, true );
			}
		}
		$dest = self::dir( $id );
		if ( is_dir( $dest ) ) {
			$wp_filesystem->delete( $dest, true );
		}
		$ok = $wp_filesystem->move( $src, $dest, true );
		$wp_filesystem->delete( $stage, true );
		if ( ! $ok ) {
			return new WP_Error( 'nb_pack', 'Could not move the pack into place.' );
		}
		$all        = self::installed();
		$all[ $id ] = $meta;
		update_option( self::OPTION, $all, false );
		return true;
	}

	public static function remove( $id ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		global $wp_filesystem;
		if ( WP_Filesystem() && is_dir( self::dir( $id ) ) ) {
			$wp_filesystem->delete( self::dir( $id ), true );
		}
		$all = self::installed();
		unset( $all[ $id ] );
		update_option( self::OPTION, $all, false );
		return true;
	}

	/** Remove every pack (plugin deleted). */
	public static function remove_all() {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		global $wp_filesystem;
		if ( WP_Filesystem() && is_dir( self::dir() ) ) {
			$wp_filesystem->delete( self::dir(), true );
		}
		delete_option( self::OPTION );
		delete_transient( self::CATALOG );
	}

	private static function run( $op, $id ) {
		if ( ! preg_match( '/^[a-z0-9-]+$/', $id ) ) {
			return new WP_Error( 'nb_pack', 'Unknown pack.' );
		}
		return 'remove' === $op ? self::remove( $id ) : self::install( $id );
	}

	public static function handle_post() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to do that.', 'notation-bible' ) );
		}
		check_admin_referer( 'nb_pack' );
		$op  = sanitize_key( wp_unslash( $_POST['op'] ?? '' ) );
		$id  = sanitize_key( wp_unslash( $_POST['id'] ?? '' ) );
		$msg = '';
		if ( 'refresh' === $op ) {
			self::catalog( true );
			$msg = 'refreshed';
		} else {
			$r   = self::run( $op, $id );
			$msg = is_wp_error( $r ) ? 'error:' . $r->get_error_message() : $op . ':' . $id;
		}
		wp_safe_redirect( add_query_arg( 'nb_msg', rawurlencode( $msg ), admin_url( 'admin.php?page=notation-bible-resources' ) ) );
		exit;
	}

	public static function handle_ajax() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'You are not allowed to do that.', 403 );
		}
		check_ajax_referer( 'nb_pack' );
		$r = self::run( sanitize_key( wp_unslash( $_POST['op'] ?? '' ) ), sanitize_key( wp_unslash( $_POST['id'] ?? '' ) ) );
		if ( is_wp_error( $r ) ) {
			wp_send_json_error( $r->get_error_message() );
		}
		wp_send_json_success();
	}

	public static function page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$cat  = self::catalog();
		$have = self::installed();
		$msg  = isset( $_GET['nb_msg'] ) ? sanitize_text_field( wp_unslash( $_GET['nb_msg'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$mb   = function ( $b ) {
			return $b ? number_format_i18n( $b / 1048576, 1 ) . ' MB' : '';
		};
		?>
		<div class="wrap" id="nb-packs">
			<h1>Study resources</h1>
			<?php if ( 0 === strpos( $msg, 'error:' ) ) : ?>
				<div class="notice notice-error"><p><?php echo esc_html( substr( $msg, 6 ) ); ?></p></div>
			<?php elseif ( $msg ) : ?>
				<div class="notice notice-success is-dismissible"><p>Done.</p></div>
			<?php endif; ?>
			<p>Readers add these free commentaries to their own library from the <strong>Store</strong> in the reader's menu. Without anything installed here, a reader's copy is read from GitHub. <strong>Optional:</strong> install packs here to serve them from this site instead (faster, and readers' browsers then never contact GitHub). Installed packs are stored in <code><?php echo esc_html( str_replace( ABSPATH, '', self::dir() ) ); ?></code>.</p>
			<p>Included with the plugin itself: Jamieson-Fausset-Brown, the Treasury of Scripture Knowledge cross references and Spurgeon's Morning and Evening.</p>
			<?php if ( ! $cat ) : ?>
				<div class="notice notice-warning inline"><p>Could not read the list of packs from GitHub. Check that this site can reach github.com, then try again.</p></div>
			<?php else : ?>
				<p><button type="button" class="button button-primary" id="nb-install-all">Install all</button> <span id="nb-status" style="margin-left:8px"></span></p>
				<table class="widefat striped" style="max-width:980px">
					<thead><tr><th>Commentary</th><th>Books</th><th>Download</th><th>Licence</th><th style="width:210px"></th></tr></thead>
					<tbody>
					<?php foreach ( $cat as $id => $p ) : ?>
						<?php
						$on    = isset( $have[ $id ] );
						$stale = $on && ( $have[ $id ]['built'] ?? '' ) !== ( $p['built'] ?? '' );
						?>
						<tr data-id="<?php echo esc_attr( $id ); ?>" data-on="<?php echo $on ? '1' : '0'; ?>">
							<td><strong><?php echo esc_html( $p['name'] ?? $id ); ?></strong><br><span class="description"><?php echo esc_html( $p['about'] ?? '' ); ?></span></td>
							<td><?php echo esc_html( count( (array) ( $p['books'] ?? array() ) ) ); ?></td>
							<td><?php echo esc_html( $mb( $p['zip_bytes'] ?? 0 ) ); ?></td>
							<td><?php echo esc_html( $p['license'] ?? '' ); ?></td>
							<td>
								<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline">
									<?php wp_nonce_field( 'nb_pack' ); ?>
									<input type="hidden" name="action" value="nb_pack"><input type="hidden" name="id" value="<?php echo esc_attr( $id ); ?>">
									<?php if ( $on ) : ?>
										<span class="nb-state" style="color:#0a7d22;margin-right:8px">Installed</span>
										<?php if ( $stale ) : ?><button class="button" name="op" value="install">Update</button><?php endif; ?>
										<button class="button-link-delete button-link" name="op" value="remove">Remove</button>
									<?php else : ?>
										<span class="nb-state" style="margin-right:8px"></span>
										<button class="button" name="op" value="install">Install</button>
									<?php endif; ?>
								</form>
							</td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="margin-top:12px">
					<?php wp_nonce_field( 'nb_pack' ); ?><input type="hidden" name="action" value="nb_pack">
					<button class="button" name="op" value="refresh">Check for new packs</button>
				</form>
				<script>
				(function () {
					var btn = document.getElementById('nb-install-all'), st = document.getElementById('nb-status');
					btn.addEventListener('click', async function () {
						var rows = [].slice.call(document.querySelectorAll('#nb-packs tr[data-on="0"]'));
						if (!rows.length) { st.textContent = 'Everything is installed.'; return; }
						btn.disabled = true; var failed = 0;
						for (var i = 0; i < rows.length; i++) {
							var r = rows[i], cell = r.querySelector('.nb-state');
							st.textContent = 'Installing ' + (i + 1) + ' of ' + rows.length + '…'; cell.textContent = 'Installing…';
							var f = new FormData(); f.append('action', 'nb_pack'); f.append('op', 'install'); f.append('id', r.dataset.id);
							f.append('_ajax_nonce', <?php echo wp_json_encode( wp_create_nonce( 'nb_pack' ) ); ?>);
							try {
								var res = await fetch(<?php echo wp_json_encode( admin_url( 'admin-ajax.php' ) ); ?>, { method: 'POST', body: f, credentials: 'same-origin' });
								var j = await res.json();
								if (j && j.success) { cell.textContent = 'Installed'; cell.style.color = '#0a7d22'; r.dataset.on = '1'; var b = r.querySelector('button[value=install]'); if (b) b.remove(); }
								else { failed++; cell.textContent = (j && j.data) || 'Failed'; cell.style.color = '#b32d2e'; }
							} catch (e) { failed++; cell.textContent = 'Failed'; cell.style.color = '#b32d2e'; }
						}
						st.textContent = failed ? failed + ' could not be installed.' : 'All installed.';
						btn.disabled = false;
						if (!failed) setTimeout(function () { location.reload(); }, 800);
					});
				})();
				</script>
			<?php endif; ?>
		</div>
		<?php
	}
}
